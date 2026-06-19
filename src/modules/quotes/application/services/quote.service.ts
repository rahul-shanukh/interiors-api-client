import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quote } from '../../infrastructure/persistence/mongo/quote.schema';
import { CreateQuoteDto } from '../dto/create-quote.dto';
import { QuoteMapper } from 'src/infrastructure/mappers/quote.mapper';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter } from 'prom-client';
import { NotificationDispatcher } from 'src/infrastructure/notifications/queue/notification.dispatcher';
import {
  NotificationCategory,
  NotificationPriority,
  NotificationStatus,
  NotificationType,
} from 'src/infrastructure/notifications/core/types/notification.types';

@Injectable()
export class QuoteService {
  private readonly logger = new Logger(QuoteService.name);

  private readonly PRICING = {
    baseBhk: {
      '1 BHK': 100000,
      '2 BHK': 200000,
      '3 BHK': 300000,
      '4+ BHK / Villa': 800000,
    },
    rooms: {
      living: 30000,
      kitchen: 20000,
      bedroom: 30000,
      bathroom: 20000,
      dining: 30000,
    },
    packageMultiplier: {
      Essential: 1.0,
      Premium: 1.4,
      Luxe: 2.0,
    },
  };

  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectMetric('quotes_created_total')
    private readonly quotesCreatedCounter: Counter<string>,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  private calculateEstimate(dto: CreateQuoteDto): number {
    const baseCost = this.PRICING.baseBhk[dto.bhkType] || 0;
    const roomCost =
      dto.rooms.living * this.PRICING.rooms.living +
      dto.rooms.kitchen * this.PRICING.rooms.kitchen +
      dto.rooms.bedroom * this.PRICING.rooms.bedroom +
      dto.rooms.bathroom * this.PRICING.rooms.bathroom +
      (dto.rooms.dining ?? 0) * this.PRICING.rooms.dining;
    const multiplier = this.PRICING.packageMultiplier[dto.package] || 1.0;
    return (baseCost + roomCost) * multiplier;
  }

  async createQuoteRequest(dto: CreateQuoteDto) {
    try {
      const calculatedPrice = this.calculateEstimate(dto);
      const quoteData = QuoteMapper.toPersistence(dto, calculatedPrice);
      const newQuote = new this.quoteModel(quoteData);
      const savedQuote = await newQuote.save();

      this.quotesCreatedCounter.inc({ status: 'success' });

      await this.notificationDispatcher.dispatch({
        notificationId: savedQuote._id.toString(),
        traceId: `tr-${Date.now()}`,
        type: 'EMAIL' as NotificationType,
        priority: 'high' as NotificationPriority,
        category: 'TRANSACTIONAL' as NotificationCategory,
        recipient: {
          email: dto.email,
          name: dto.name || 'Valued Client',
          userId: savedQuote._id.toString(),
        },
        subject: 'JC Interiors - Your Estimate is Ready',
        templateName: 'quote-estimate',
        templateData: {
          name: dto.name,
          bhkType: dto.bhkType,
          estimatedPrice: calculatedPrice,
          package: dto.package,
        },
        status: 'PENDING' as NotificationStatus,
        attempts: 0,
        createdAt: new Date(),
        metadata: {},
      });

      return {
        success: true,
        message: 'Quote generated successfully',
        quoteId: savedQuote._id,
        estimatedPrice: calculatedPrice,
      };
    } catch (error) {
      this.quotesCreatedCounter.inc({ status: 'failed' });
      throw error;
    }
  }
}
