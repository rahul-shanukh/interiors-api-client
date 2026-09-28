import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { QuoteController } from "./controllers/quote.controller";
import { QuoteService } from "./application/services/quote.service";
import {
  Quote,
  QuoteSchema,
} from "./infrastructure/persistence/mongo/quote.schema";
import { makeCounterProvider } from "@willsoto/nestjs-prometheus";
import { NotificationModule } from "src/infrastructure/notifications/notification.module";
import { FullHomePricingStrategy } from "./domain/pricing/strategies/full-home-pricing.strategy";
import { PricingStrategy } from "./domain/pricing/pricing-strategy.interface";
import {
  PRICING_STRATEGIES,
  PricingStrategyResolver,
} from "./application/pricing/pricing-strategy-resolver.service";
import { QuoteSubmissionGuardService } from "./application/services/quote-submission-guard.service";
import {
  FullHomeQuote,
  FullHomeQuoteSchema,
} from "./infrastructure/persistence/mongo/full-home-quote.schema";
import {
  KitchenQuote,
  KitchenQuoteSchema,
} from "./infrastructure/persistence/mongo/kitchen-quote.schema";
import {
  WardrobeQuote,
  WardrobeQuoteSchema,
} from "./infrastructure/persistence/mongo/wardrobe-quote.schema";
import { CustomerService } from "./application/services/customer.service";
import {
  Customer,
  CustomerSchema,
} from "./infrastructure/persistence/mongo/customers.schema";
import { CacheModule } from "src/infrastructure/cache/cache.module";
import { CalculatorType } from "./domain/enums/calculator-type.enum";
import { QuoteRequestRateLimiter } from "src/infrastructure/cache/rate-limiters/quote-request-rate-limiter.service";
import { KitchenPricingStrategy } from "./domain/pricing/strategies/kitchen-pricing.strategy";
import { WardrobePricingStrategy } from "./domain/pricing/strategies/wardrobe-pricing.strategy";

@Module({
  imports: [
    CacheModule,
    MongooseModule.forFeature([
      {
        name: Quote.name,
        schema: QuoteSchema,
        discriminators: [
          {
            name: FullHomeQuote.name,
            schema: FullHomeQuoteSchema,
            value: CalculatorType.FULL_HOME,
          },
          {
            name: KitchenQuote.name,
            schema: KitchenQuoteSchema,
            value: CalculatorType.KITCHEN,
          },
          {
            name: WardrobeQuote.name,
            schema: WardrobeQuoteSchema,
            value: CalculatorType.WARDROBE,
          },
        ],
      },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    NotificationModule,
  ],
  controllers: [QuoteController],
  providers: [
    QuoteService,
    CustomerService,
    QuoteSubmissionGuardService,
    QuoteRequestRateLimiter,
    FullHomePricingStrategy,
    KitchenPricingStrategy,
    WardrobePricingStrategy,
    {
      provide: PRICING_STRATEGIES,
      useFactory: (
        fullHomePricingStrategy: FullHomePricingStrategy,
        kitchenPricingStrategy: KitchenPricingStrategy,
        wardrobePricingStrategy: WardrobePricingStrategy,
      ): PricingStrategy[] => [
        fullHomePricingStrategy,
        kitchenPricingStrategy,
        wardrobePricingStrategy,
      ],
      inject: [
        FullHomePricingStrategy,
        KitchenPricingStrategy,
        WardrobePricingStrategy,
      ],
    },
    PricingStrategyResolver,
    makeCounterProvider({
      name: "quotes_created_total",
      help: "Total number of successfully created quotes",
      labelNames: ["status"],
    }),
  ],
  exports: [QuoteService],
})
export class QuotesModule {}
