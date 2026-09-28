import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Quote } from "./quote.schema";

@Schema({ timestamps: true })
export class KitchenQuote extends Quote {
  @Prop({ required: true, type: String })
  layout!: string;

  @Prop({ required: true, type: String })
  builtupArea!: string;

  @Prop({ required: true, type: String })
  package!: string;
}

export const KitchenQuoteSchema = SchemaFactory.createForClass(KitchenQuote);
