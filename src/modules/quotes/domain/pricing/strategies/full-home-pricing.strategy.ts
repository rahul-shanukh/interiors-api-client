import { CreateFullHomeQuoteDto } from "src/modules/quotes/application/dto/request/create-full-home-quote.dto";
import { CalculatorType } from "../../enums/calculator-type.enum";
import { PricingStrategy } from "../pricing-strategy.interface";
import { Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { InjectMetric } from "@willsoto/nestjs-prometheus";
import { Model } from "mongoose";
import { Quote } from "src/modules/quotes/infrastructure/persistence/mongo/quote.schema";
import { Counter } from "prom-client";
import { NotificationDispatcher } from "src/infrastructure/notifications/queue/notification.dispatcher";
import { ConfigService } from "@nestjs/config";

export class FullHomePricingStrategy implements PricingStrategy {
  private readonly logger = new Logger(FullHomePricingStrategy.name);

  readonly version: string;

  private readonly PRICING = {
    baseBhk: {
      "1BHK": 100000,
      "2BHK": 200000,
      "3BHK": 300000,
      "4+ BHK / Villa": 500000,
    },
    rooms: {
      living: 30000,
      kitchen: 20000,
      bedroom: 30000,
      bathroom: 20000,
      dining: 30000,
    },
    packageMultiplier: {
      ESSENTIAL: 1.0,
      PREMIUM: 1.4,
      LUXURY: 2.0,
    },
    areaMultiplier: {
      BELOW_800: 1.0,
      ABOVE_800: 1.25,
    },
  };

  constructor(
    @InjectModel(Quote.name) private quoteModel: Model<Quote>,
    @InjectMetric("quotes_created_total")
    private readonly quotesCreatedCounter: Counter<string>,
    private readonly notificationDispatcher: NotificationDispatcher,
    private readonly config: ConfigService,
  ) {
    this.version =
      this.config.get<string>("ACTIVE_FULL_HOME_PRICING_VERSION") ||
      "full-home-v1";
  }

  supports(type: CalculatorType): boolean {
    return type === CalculatorType.FULL_HOME;
  }

  calculateEstimate(quoteRequest: CreateFullHomeQuoteDto): number {
    // 1. Guard check for calculator type using strict equality ===
    if (quoteRequest.calculatorType !== CalculatorType.FULL_HOME) {
      throw new Error(
        `Invalid calculator type: ${quoteRequest.calculatorType}`,
      );
    }

    const {
      bhkType,
      builtupArea,
      rooms,
      package: packageType,
    } = quoteRequest.configuration;

    // 2. Base BHK Cost
    const baseCost = this.PRICING.baseBhk[bhkType] || 0;

    // 3. Room Additions Cost
    const roomCost =
      (rooms.living || 0) * this.PRICING.rooms.living +
      (rooms.kitchen || 0) * this.PRICING.rooms.kitchen +
      (rooms.bedroom || 0) * this.PRICING.rooms.bedroom +
      (rooms.bathroom || 0) * this.PRICING.rooms.bathroom +
      (rooms.dining ?? 0) * this.PRICING.rooms.dining;

    // 4. Area Multiplier / Modifier (e.g., 1.0x for below 800, 1.25x for above 800)
    const isBelow800 = builtupArea === "Below 800 sq. ft.";
    const areaMultiplier = isBelow800
      ? this.PRICING.areaMultiplier?.BELOW_800 || 1.0
      : this.PRICING.areaMultiplier?.ABOVE_800 || 1.25;

    // 5. Package Multiplier
    const packageMultiplier =
      this.PRICING.packageMultiplier[packageType] || 1.0;

    // 6. Calculate Total
    return (baseCost + roomCost) * areaMultiplier * packageMultiplier;
  }

  getPricingSnapshot(): Record<string, unknown> {
    return structuredClone(this.PRICING);
  }
}
