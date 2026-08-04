import { CreateQuoteDto } from "src/modules/quotes/application/dto/create-quote.dto";
import { CalculatorType } from "../../enums/calculator-type.enum";
import { PricingStrategy } from "../pricing-strategy.interface";
import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Model } from "mongoose";
import { Quote } from "src/modules/quotes/infrastructure/persistence/mongo/quote.schema";
import { Counter } from "prom-client";
import { NotificationDispatcher } from "src/infrastructure/notifications/queue/notification.dispatcher";

export class FullHomePricingStrategy implements PricingStrategy {
  private readonly logger = new Logger(FullHomePricingStrategy.name);

  private readonly PRICING = {
    baseBhk: {
      "1 BHK": 100000,
      "2 BHK": 200000,
      "3 BHK": 300000,
      "4+ BHK / Villa": 800000,
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
    @InjectMetric("quotes_created_total")
    private readonly quotesCreatedCounter: Counter<string>,
    private readonly notificationDispatcher: NotificationDispatcher,
  ) {}

  supports(type: CalculatorType): boolean {
    return type === CalculatorType.FULL_HOME;
  }

  calculateEstimate(quoteRequest: CreateQuoteDto): number {
    quoteRequest.calculatorType = CalculatorType.FULL_HOME;
    const baseCost = this.PRICING.baseBhk[quoteRequest.bhkType] || 0;
    const roomCost =
      quoteRequest.rooms.living * this.PRICING.rooms.living +
      quoteRequest.rooms.kitchen * this.PRICING.rooms.kitchen +
      quoteRequest.rooms.bedroom * this.PRICING.rooms.bedroom +
      quoteRequest.rooms.bathroom * this.PRICING.rooms.bathroom +
      (quoteRequest.rooms.dining ?? 0) * this.PRICING.rooms.dining;
    const multiplier =
      this.PRICING.packageMultiplier[quoteRequest.package] || 1.0;
    return (baseCost + roomCost) * multiplier;
  }
}
