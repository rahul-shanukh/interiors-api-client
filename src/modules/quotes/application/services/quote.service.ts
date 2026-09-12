import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Connection, Model } from "mongoose";
import { Quote } from "../../infrastructure/persistence/mongo/quote.schema";
import { CreateFullHomeQuoteDto } from "../dto/request/create-full-home-quote.dto";
import { normalizeQuoteData } from "../types/normalized_quote_data.types";
import { QuoteMapper } from "src/infrastructure/mappers/quote.mapper";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter } from "prom-client";
import { QuoteRequestRateLimiter } from "src/infrastructure/cache/rate-limiters/quote-request-rate-limiter.service";
import { NotificationDispatcher } from "src/infrastructure/notifications/queue/notification.dispatcher";
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from "src/infrastructure/notifications/core/types/notification.types";

import { PricingStrategyResolver } from "../pricing/pricing-strategy-resolver.service";
import { QuoteSubmissionGuardService } from "./quote-submission-guard.service";
import { CustomerService } from "./customer.service";
import { FullHomeQuote } from "../../infrastructure/persistence/mongo/full-home-quote.schema";
import { CalculatorType } from "../../domain/enums/calculator-type.enum";

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(FullHomeQuote.name)
    private fullHomeQuoteModel: Model<FullHomeQuote>,
    @InjectMetric("quotes_created_total")
    private readonly quotesCreatedCounter: Counter<string>,
    private readonly notificationDispatcher: NotificationDispatcher,
    private readonly pricingStrategyResolver: PricingStrategyResolver,
    private readonly quoteSubmissionGuardService: QuoteSubmissionGuardService,
    private readonly customerService: CustomerService,
    private readonly quoteRequestRateLimiter: QuoteRequestRateLimiter,
  ) {}

  async createQuoteRequest(dto: CreateFullHomeQuoteDto, clientIp: string) {
    await this.quoteRequestRateLimiter.check(dto, clientIp);

    // Redis Duplicate Guard (Short-term spam prevention)
    const normalized = normalizeQuoteData(dto);
    const { fingerprint, isDuplicate } =
      await this.quoteSubmissionGuardService.isDuplicateSubmission(normalized);

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

    const existingQuote = await this.fullHomeQuoteModel.findOneAndUpdate(
      { fingerPrint: fingerprint },
      {
        $inc: { resubmissionCount: 1 },
        $set: { lastResubmittedAt: new Date() },
      },
      { new: true },
    );

    // ==========================================
    // PATH A: EXISTING QUOTE
    // ==========================================

    if (existingQuote) {
      this.logger.log({
        event: "duplicate_quote_in_db",
        fingerprint,
        calculatorType: dto.calculatorType,
        email: dto.email,
        resubmissionCount: existingQuote.resubmissionCount,
      });

      // Release the Redis lock immediately since we handled it gracefully
      try {
        await this.quoteSubmissionGuardService.releaseLock(fingerprint);
      } catch (error) {
        this.logger.error({
          event: "failed_to_release_quote_submission_lock",
          fingerprint,
          error,
        });
      }

      // Re-send the notification so the user gets the email again
      const notificationStatus = await this.dispatchQuoteNotification(
        existingQuote._id.toString(),
        dto,
        existingQuote.customer.toString(),
        existingQuote.customerKey, // Pass the key!
        existingQuote.estimatedPrice,
      );

      return {
        success: true,
        message: "Quote retrieved successfully",
        quoteId: existingQuote._id.toString(),
        estimatedPrice: existingQuote.estimatedPrice,
        notificationStatus,
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
          pricingStrategy.version,
          pricingStrategy.getPricingSnapshot(),
          customer._id.toString(),
          customer.customerKey,
          dto.calculatorType,
          fingerprint,
        );

        quoteData.fingerPrint = fingerprint;

        let newQuote: Quote;

        switch (dto.calculatorType) {
          case CalculatorType.FULL_HOME:
            newQuote = new this.fullHomeQuoteModel(quoteData);
            break;
          default:
            throw new Error(
              `Unsupported calculator type: ${dto.calculatorType}`,
            );
        }
        savedQuote = await newQuote.save({ session });
      });
      this.quotesCreatedCounter.inc({ status: "success" });
    } catch (error: any) {
      // 1. Safe cleanup: Never allow Redis cleanup errors to mask the main DB error
      try {
        await this.quoteSubmissionGuardService.releaseLock(fingerprint);
      } catch (lockError) {
        this.logger.error(
          "Failed to release duplicate submission lock",
          lockError,
        );
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
    await this.quoteSubmissionGuardService.releaseLock(fingerprint);

    // PATH B Notification Dispatch
    const notificationStatus = await this.dispatchQuoteNotification(
      savedQuote._id.toString(),
      dto,
      customer._id.toString(),
      customer.customerKey,
      calculatedPrice,
    );

    return {
      success: true,
      message: "Quote generated successfully",
      quoteId: savedQuote._id.toString(),
      estimatedPrice: calculatedPrice,
      notificationStatus,
    };
  }

  /**
   * Private helper to dispatch quote emails cleanly for both new and existing quotes
   */
  /**
   * Private helper to dispatch quote emails cleanly for both new and existing quotes
   */
  private async dispatchQuoteNotification(
    quoteId: string, // strictly a string
    dto: CreateFullHomeQuoteDto,
    customerId: string, // strictly a string
    customerKey: string, // strictly a string
    calculatedPrice: number,
  ) {
    try {
      await this.notificationDispatcher.dispatch({
        notificationId: quoteId, // Use directly
        traceId: `tr-${Date.now()}`,
        type: "EMAIL" as NotificationType,
        priority: "high" as NotificationPriority,
        category: "TRANSACTIONAL" as NotificationCategory,
        recipient: {
          email: dto.email,
          name: dto.name || "Valued Client",
          userId: customerId, // Use directly
          customerKey: customerKey, // Use directly
        },
        subject: "EastInteria Interiors - Your Estimate is Ready",
        templateName: "quote-estimate",
        templateData: {
          name: dto.name,
          bhkType: dto.configuration.bhkType,
          estimatedPrice: calculatedPrice,
          package: dto.configuration.package,
        },
        status: "PENDING" as NotificationStatus,
        attempts: 0,
        createdAt: new Date(),
        metadata: {},
      });
      return "QUEUED";
    } catch (notificationError) {
      this.logger.error("Failed to dispatch notification for quote", {
        quoteId,
        error: notificationError,
      });
      return "FAILED_TO_QUEUE";
    }
  }
}
