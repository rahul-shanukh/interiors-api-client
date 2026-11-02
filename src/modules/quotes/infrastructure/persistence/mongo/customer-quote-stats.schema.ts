//src/modules/quotes/infrastructure/persistence/mongo/customer-quote-stats.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongooseSchema, Types } from "mongoose";
import { CalculatorType } from "../../../domain/enums/calculator-type.enum";

/**
 * Per-calculator quote counters.
 *
 * Keep this shape explicit while the supported calculator types are known.
 * It makes invalid calculator names impossible to store accidentally.
 */
@Schema({ _id: false })
export class RequestedByCalculator {
  @Prop({ type: Number, default: 0, min: 0 })
  full_home!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  kitchen!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  wardrobe!: number;
}

export const RequestedByCalculatorSchema =
  SchemaFactory.createForClass(RequestedByCalculator);

export type RequestedByCalculatorCounts = Record<CalculatorType, number>;

/**
 * A read model for fast per-customer quote-request counts.
 *
 * One document exists for each Customer document. It is a fast read model for
 * quote-request counts; individual Quote documents remain the source of truth.
 */
@Schema({
  timestamps: true,
  collection: "customer_quote_stats",
})
export class CustomerQuoteStats {
  @Prop({
    type: MongooseSchema.Types.ObjectId,
    ref: "Customer",
    required: true,
    unique: true,
    index: true,
    immutable: true,
  })
  customerId!: Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  totalRequested!: number;

  @Prop({ type: RequestedByCalculatorSchema, default: () => ({}) })
  requestedByCalculator!: RequestedByCalculatorCounts;

  @Prop({ type: Date })
  lastRequestedAt?: Date;
}

export type CustomerQuoteStatsDocument = HydratedDocument<CustomerQuoteStats>;

export const CustomerQuoteStatsSchema =
  SchemaFactory.createForClass(CustomerQuoteStats);
