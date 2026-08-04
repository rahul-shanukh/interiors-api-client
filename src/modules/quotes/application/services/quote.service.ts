import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Quote } from "../../infrastructure/persistence/mongo/quote.schema";
import { CreateQuoteDto } from "../dto/create-quote.dto";
import { QuoteMapper } from "src/infrastructure/mappers/quote.mapper";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Counter } from "prom-client";
import { NotificationDispatcher } from "src/infrastructure/notifications/queue/notification.dispatcher";
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from "src/infrastructure/notifications/core/types/notification.types";
import { PricingStrategyResolver } from "../pricing/pricing-strategy-resolver.service";

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectMetric("quotes_created_total")
    private readonly quotesCreatedCounter: Counter<string>,
    private readonly notificationDispatcher: NotificationDispatcher,
    private readonly pricingStrategyResolver: PricingStrategyResolver,
  ) {}

  async createQuoteRequest(dto: CreateQuoteDto) {
    try {
      const pricingStrategy = this.pricingStrategyResolver.resolve(
        dto.calculatorType as any,
      );
      const calculatedPrice = pricingStrategy.calculateEstimate(dto);
      const quoteData = QuoteMapper.toPersistence(dto, calculatedPrice);
      const newQuote = new this.quoteModel(quoteData);
      const savedQuote = await newQuote.save();

      this.quotesCreatedCounter.inc({ status: "success" });

      await this.notificationDispatcher.dispatch({
        notificationId: savedQuote._id.toString(),
        traceId: `tr-${Date.now()}`,
        type: "EMAIL" as NotificationType,
        priority: "high" as NotificationPriority,
        category: "TRANSACTIONAL" as NotificationCategory,
        recipient: {
          email: dto.email,
          name: dto.name || "Valued Client",
          userId: savedQuote._id.toString(),
        },
        subject: "JC Interiors - Your Estimate is Ready",
        templateName: "quote-estimate",
        templateData: {
          name: dto.name,
          bhkType: dto.bhkType,
          estimatedPrice: calculatedPrice,
          package: dto.package,
        },
        status: "PENDING" as NotificationStatus,
        attempts: 0,
        createdAt: new Date(),
        metadata: {},
      });

      return {
        success: true,
        message: "Quote generated successfully",
        quoteId: savedQuote._id.toString(),
        estimatedPrice: calculatedPrice,
      };
    } catch (error) {
      this.quotesCreatedCounter.inc({ status: "failed" });
      throw error;
    }
  }
}
