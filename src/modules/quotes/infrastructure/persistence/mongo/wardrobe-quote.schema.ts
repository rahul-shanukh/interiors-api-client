import { Schema, SchemaFactory } from "@nestjs/mongoose";
import { Quote } from "./quote.schema";

@Schema({ timestamps: true })
export class WardrobeQuote extends Quote {}

export const WardrobeQuoteSchema = SchemaFactory.createForClass(WardrobeQuote);
