// backend\src\modules\quotes\infrastructure\persistence\mongo\quote.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({ _id: false })
class RoomCounts {
  @Prop({ required: true, default: 0 }) living!: number;
  @Prop({ required: true, default: 0 }) kitchen!: number;
  @Prop({ required: true, default: 0 }) bedroom!: number;
  @Prop({ required: true, default: 0 }) bathroom!: number;
  @Prop({ required: true, default: 0 }) dining!: number;
}

@Schema({ timestamps: true })
export class Quote extends Document {
  @Prop({ required: true, index: true })
  calculatorType!: string;

  @Prop({ required: true })
  bhkType!: string;

  @Prop({ type: RoomCounts, required: true })
  rooms!: RoomCounts;

  @Prop({ required: true })
  package!: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  phone!: string;

  @Prop({ required: true })
  email!: string;

  @Prop({ required: true })
  estimatedPrice!: number;

  // Lead lifecycle
  @Prop({ default: "NEW_LEAD", index: true })
  leadStatus!: string;

  @Prop({ default: "UNCONTACTED" })
  contactStatus!: string;

  @Prop({ default: "PENDING" })
  dealStatus!: string;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);
