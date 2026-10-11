import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { Quote } from "../../infrastructure/persistence/mongo/quote.schema";
import { AnyQuoteRequestDto } from "../dto/base-quote-request.dto";
import { normalizeQuoteData } from "../types/normalized_quote_data.types";
import { QuoteMapper } from "src/infrastructure/mappers/quote.mapper";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter } from "prom-client";
import { QuoteRequestRateLimiter } from "src/infrastructure/cache/rate-limiters/quote-request-rate-limiter.service";
import { NotificationDispatcher } from "src/infrastructure/notifications/queue/notification.dispatcher";
import { PricingStrategyResolver } from "../pricing/pricing-strategy-resolver.service";
import { QuoteSubmissionGuardService } from "./quote-submission-guard.service";
import { CustomerService } from "./customer.service";
import { FullHomeQuote } from "../../infrastructure/persistence/mongo/full-home-quote.schema";
import { CalculatorType } from "../../domain/enums/calculator-type.enum";
import { KitchenQuote } from "../../infrastructure/persistence/mongo/kitchen-quote.schema";
import { WardrobeQuote } from "../../infrastructure/persistence/mongo/wardrobe-quote.schema";
import { trace } from "@opentelemetry/api";
import { RecaptchaService } from "src/infrastructure/recaptcha/recaptcha.service";
import { IdempotencyService } from "src/infrastructure/idempotency/idempotency.service";
import { CreateQuoteResponseDto } from "../dto/response/create-quote-response.dto";
import type {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from "src/infrastructure/notifications/core/types/notification.types";

export interface IdempotencyContext {
  caller: string;
  operation: string;
  key: string;
  request: Record<string, any>;
}
@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(FullHomeQuote.name)
    private fullHomeQuoteModel: Model<FullHomeQuote>,
    @InjectModel(KitchenQuote.name)
    private kitchenQuoteModel: Model<KitchenQuote>,
    @InjectModel(WardrobeQuote.name)
    private wardrobeQuoteModel: Model<WardrobeQuote>,
    @InjectMetric("quotes_created_total")
    private readonly quotesCreatedCounter: Counter<string>,
    private readonly notificationDispatcher: NotificationDispatcher,
    private readonly pricingStrategyResolver: PricingStrategyResolver,
    private readonly quoteQuickSubmissionGuardService: QuoteSubmissionGuardService,
    private readonly customerService: CustomerService,
    private readonly quoteRequestRateLimiter: QuoteRequestRateLimiter,
    private readonly recaptchaService: RecaptchaService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  async createQuoteRequest(
    dto: AnyQuoteRequestDto,
    clientIp: string,
    idempotencyKey: string,
  ): Promise<CreateQuoteResponseDto> {
    const { recaptchaToken, ...idempotentPayload } = dto;

    if (!idempotencyKey) {
      throw new ConflictException("Idempotency-Key is required.");
    }

    // Rate limit check to prevent abuse of the quote submission endpoint.
    await this.quoteRequestRateLimiter.check(dto, clientIp);

    // Verify before duplicate handling, database writes, or notifications.
    await this.recaptchaService.verify(recaptchaToken, "quote_submit");

    const idempotencyContext: IdempotencyContext = {
      caller: dto.email,
      operation: "quote.create",
      key: idempotencyKey,
      request: idempotentPayload,
    };
    const previousResult =
      await this.idempotencyService.getSavedResult(idempotencyContext);
    if (previousResult) return previousResult as CreateQuoteResponseDto;

    // i.e.., for full-home : BhkType , for kitchen : Layout , for wardrobe : Wardrobe Type
    let summaryLabel = "";
    let packageName = "";

    // Determine summary label and package name based on calculator type
    switch (dto.calculatorType) {
      case CalculatorType.FULL_HOME:
        summaryLabel = dto.configuration.bhkType;
        packageName = dto.configuration.package;
        break;
      case CalculatorType.KITCHEN:
        summaryLabel = dto.configuration.layout;
        packageName = dto.configuration.package;
        break;
      case CalculatorType.WARDROBE:
        summaryLabel = dto.configuration.wardrobeType;
        packageName = dto.configuration.package;
        break;
    }

    // Redis Duplicate Guard (Short-term spam prevention)
    const normalized = normalizeQuoteData(dto);
    const { fingerprint, isDuplicate } =
      await this.quoteQuickSubmissionGuardService.isDuplicateSubmission(
        normalized,
      );

    if (isDuplicate) {
      this.logger.warn({
        event: "duplicate_quote_submission",
        fingerprint,
        calculatorType: dto.calculatorType,
        email: dto.email,
        phone: dto.phone,
      });
      throw new ConflictException(
        "Potential duplicate quote submission detected",
      );
    }

    // ==========================================
    // PATH A: EXISTING QUOTE
    // ==========================================

    const quoteModel = this.getQuoteModel(dto.calculatorType);

    const existingQuote = await quoteModel.findOneAndUpdate(
      { fingerPrint: fingerprint },
      {
        $inc: { resubmissionCount: 1 },
        $set: { lastResubmittedAt: new Date() },
      },
      { new: true }, // return true
    );

    if (existingQuote) {
      this.logger.log({
        event: "duplicate_quote_in_db",
        fingerprint,
        calculatorType: dto.calculatorType,
        email: dto.email,
        resubmissionCount: existingQuote.resubmissionCount,
      });

      // Resubmission means the customer is asking for their quote again,
      // so always re-send the notification even if it was sent before.
      const resendContext = this.buildQuoteNotificationContext(
        existingQuote._id.toString(),
        dto.email,
        dto.name,
        summaryLabel,
        packageName,
        existingQuote.customer.toString(),
        existingQuote.customerKey,
        existingQuote.estimatedPrice,
      );

      void this.notificationDispatcher
        .dispatch(resendContext)
        .catch((err) =>
          this.logger.error(
            `Failed to dispatch resend notification for quote ID: ${existingQuote._id.toString()}`,
            err,
          ),
        );

      return {
        success: true,
        message: "Quote retrieved successfully, duplicate submission handled.",
        quoteId: existingQuote._id.toString(),
        estimatedPrice: existingQuote.estimatedPrice,
        notificationStatus: "QUEUED",
      };
    }

    // ==========================================
    // PATH B: NEW QUOTE
    // ==========================================

    const pricingStrategy = this.pricingStrategyResolver.resolve(
      dto.calculatorType as CalculatorType,
    );

    const calculatedPrice = pricingStrategy.calculateEstimate(dto);

    const session = await this.connection.startSession();
    let savedQuote!: Quote;
    let customer: any;

    try {
      await session.withTransaction(async () => {
        await this.idempotencyService.claim(idempotencyContext, session);
        customer = await this.customerService.findOrCreateCustomer(
          {
            email: dto.email,
            name: dto.name,
            phone: dto.phone,
          },
          session,
        );

        const quoteData = QuoteMapper.toPersistence(
          dto,
          calculatedPrice,
          pricingStrategy.pricingVersion,
          pricingStrategy.getPricingSnapshot(),
          customer._id.toString(),
          customer.customerKey,
          dto.calculatorType,
          fingerprint,
        );

        quoteData.fingerPrint = fingerprint;

        const newQuote = new quoteModel(quoteData);
        savedQuote = await newQuote.save({ session });
        const response = {
          success: true,
          message: "Quote generated successfully",
          quoteId: savedQuote._id.toString(),
          estimatedPrice: calculatedPrice,
          notificationStatus: "QUEUED",
        };
        this.logger.log(
          `Quote created successfully with ID: ${savedQuote._id.toString()}`,
        );
        await this.idempotencyService.saveResult(
          idempotencyContext,
          response,
          session,
        );
        this.logger.log(
          `Idempotency result saved successfully for quote ID: ${savedQuote._id.toString()}`,
        );
      });
      this.quotesCreatedCounter.inc({ status: "success" });
    } catch (error: any) {
      // 1. Safe cleanup: Never allow Redis cleanup errors to mask the main DB error
      try {
        await this.quoteQuickSubmissionGuardService.releaseLock(fingerprint);
      } catch (lockError) {
        this.logger.error(
          "Failed to release duplicate submission lock",
          lockError,
        );
      }

      if (
        error instanceof ConflictException &&
        !error.message.includes("fingerPrint")
      ) {
        const concurrentResult =
          await this.idempotencyService.getCompletedResult(idempotencyContext);
        if (concurrentResult) return concurrentResult as CreateQuoteResponseDto;
      }

      // 2. Catch the MongoDB Race Condition
      if (error.code === 11000 && error.keyPattern?.fingerPrint) {
        this.logger.warn({
          event: "mongodb_race_condition_prevented",
          fingerprint,
          message: "Concurrent insert prevented by MongoDB unique constraint.",
        });
        throw new ConflictException(
          "This exact quote is already being processed. Please check your email or try again in a moment.",
        );
      }

      // 2. Log and track metrics for the original transaction error
      this.logger.error("Error during quote creation transaction", error);
      this.quotesCreatedCounter.inc({ status: "failed" });
      // 3. Re-throw original error
      throw error;
    } finally {
      await session.endSession();
    }
    // Release the duplicate submission lock after successful transaction
    await this.quoteQuickSubmissionGuardService.releaseLock(fingerprint);

    // PATH B Notification Dispatch
    // Fire-and-forget after commit: the response must not wait on GCP latency,
    // and a dispatch failure must not fail the already-persisted quote.
    const notificationContext = this.buildQuoteNotificationContext(
      savedQuote._id.toString(),
      customer.email,
      customer.name,
      summaryLabel,
      packageName,
      customer._id.toString(),
      customer.customerKey,
      calculatedPrice,
    );

    this.logger.log(
      `Dispatching quote notification for quote ID: ${savedQuote._id.toString()}`,
    );

    void this.notificationDispatcher
      .dispatch(notificationContext)
      .catch((dispatchError) =>
        this.logger.error(
          `Failed to dispatch quote notification for quote ID: ${savedQuote._id.toString()}`,
          dispatchError,
        ),
      );

    return {
      success: true,
      message: "Quote generated successfully",
      quoteId: savedQuote._id.toString(),
      estimatedPrice: calculatedPrice,
      notificationStatus: "QUEUED",
    };
  }

  private buildQuoteNotificationContext(
    quoteId: string,
    email: string,
    name: string,
    summaryLabel: string,
    packageName: string,
    customerId: string,
    customerKey: string,
    calculatedPrice: number,
  ) {
    return {
      notificationId: quoteId,
      traceId: this.getCurrentTraceId(),
      type: "EMAIL" as NotificationType,
      priority: "high" as NotificationPriority,
      category: "TRANSACTIONAL" as NotificationCategory,
      recipient: { email, name, userId: customerId, customerKey },
      subject: "EastInteria Interiors - Your Estimate is Ready",
      templateName: "quote-estimate",
      templateData: {
        name,
        label: summaryLabel,
        estimatedPrice: calculatedPrice,
        package: packageName,
      },
      status: "PENDING" as NotificationStatus,
      attempts: 0,
      createdAt: new Date(),
      metadata: {},
    };
  }

  private getQuoteModel(calculatorType: CalculatorType): Model<any> {
    switch (calculatorType) {
      case CalculatorType.FULL_HOME:
        return this.fullHomeQuoteModel;
      case CalculatorType.KITCHEN:
        return this.kitchenQuoteModel;
      case CalculatorType.WARDROBE:
        return this.wardrobeQuoteModel;
      default:
        throw new Error(`Unsupported calculator type: ${calculatorType}`);
    }
  }
  private getCurrentTraceId(): string {
    return trace.getActiveSpan()?.spanContext().traceId ?? "missing-trace-id";
  }
}
