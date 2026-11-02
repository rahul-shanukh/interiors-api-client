// full-home-quote.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Quote } from "./quote.schema";

@Schema({ _id: false })
export class RoomCounts {
  @Prop({ required: true, default: 0 })
  living!: number;

  @Prop({ required: true, default: 0 })
  kitchen!: number;

  @Prop({ required: true, default: 0 })
  bedroom!: number;

  @Prop({ required: true, default: 0 })
  bathroom!: number;

  @Prop({ required: true, default: 0 })
  dining!: number;

  @Prop({ required: true, default: 0 })
  balcony!: number;

  @Prop({ required: true, default: 0 })
  pooja!: number;

  @Prop({ required: true, default: 0 })
  laundry!: number;
}

@Schema({ timestamps: true })
export class FullHomeQuote extends Quote {
  // --- Property Details ---
  @Prop({
    required: true,
    enum: ["1BHK", "2BHK", "3BHK", "4+ BHK / Villa"],
  })
  bhkType!: string;

  @Prop({ required: true })
  builtupArea!: string; // in sq ft

  @Prop({ required: true, type: RoomCounts })
  rooms!: RoomCounts;

  // --- Design & Package ---
  @Prop({
    required: true,
    enum: ["BUDGET", "STANDARD", "PREMIUM", "LUXURY", "CUSTOM", "ESSENTIAL"],
  })
  package!: string;

  @Prop({ required: false })
  designStyle?: string; // e.g., "MODERN", "TRADITIONAL", "CONTEMPORARY", etc.

  @Prop({ required: false })
  designPreferences?: string[];

  @Prop({ required: true })
  pricingVersion!: string;

  @Prop({ required: true, default: 0 })
  resubmissionCount!: number; // tracks the number of times this quote has been resubmitted

  @Prop({ default: Date.now, type: Date })
  lastResubmittedAt!: Date; // tracks the timestamp of the last resubmission

  @Prop({
    required: true,
    unique: true,
    immutable: true,
  })
  fingerPrint!: string;
}

export const FullHomeQuoteSchema = SchemaFactory.createForClass(FullHomeQuote);

// Apply the Quote schema discriminator
// FullHomeQuoteSchema.discriminatorMapping = { name: "FULL_HOME", schema: FullHomeQuoteSchema };
