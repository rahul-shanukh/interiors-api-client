import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class CatalogItemDocument extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, index: true })
  category: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  material: string;

  @Prop({ default: true })
  inStock: boolean;
}

export const CatalogItemSchema =
  SchemaFactory.createForClass(CatalogItemDocument);
