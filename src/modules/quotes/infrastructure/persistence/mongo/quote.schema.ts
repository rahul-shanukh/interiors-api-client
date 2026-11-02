// backend\src\modules\quotes\infrastructure\persistence\mongo\quote.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";

@Schema({
  timestamps: true,
  collection: "quotes",
  discriminatorKey: "calculatorType",
})
export class Quote extends Document {
  // --- Calculator Type & Fingerprint ---

  calculatorType!: string; // "FULL_HOME", "KITCHEN", "WARDROBE"

  // --- Customer Contact Info ---
  @Prop({ required: true, index: true, immutable: true })
  customerKey!: string;

  // In Quote.schema.ts
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
    index: true,
  })
  customer!: mongoose.Types.ObjectId;

  @Prop({
    type: {
      city: { type: String },
      state: { type: String },
      country: { type: String },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    required: true,
  })
  location?: {
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };

  // --- Financial Estimate ---
  @Prop({ required: true })
  estimatedPrice!: number;

  @Prop({ type: Object, required: true })
  pricingSnapshot!: Record<string, unknown>;

  // --- Quote Details ---

  @Prop({ type: Object, required: true, default: {} })
  quotesRequested!: Record<string, unknown>;

  // --- PDF & Communication Tracking ---
  @Prop()
  pdfUrl?: string;

  @Prop({ default: false })
  isEmailSent!: boolean;

  @Prop({ default: false })
  isWhatsappSent!: boolean;

  // Lead lifecycle
  @Prop({ default: "NEW_LEAD", index: true })
  leadStatus!: string;

  @Prop({ default: "UNCONTACTED" })
  contactStatus!: string;

  @Prop({ default: "PENDING" })
  dealStatus!: string;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
