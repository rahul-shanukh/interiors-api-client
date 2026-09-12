import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// --- Category Schema ---
@Schema({ timestamps: true })
export class CategoryEntity extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;
}
export const CategorySchema = SchemaFactory.createForClass(CategoryEntity);

// --- Product Schema ---
@Schema({ timestamps: true })
export class ProductEntity extends Document {
  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  price: number;

  @Prop({ type: [{ url: String, alt: String }], default: [] })
  images: { url: string; alt?: string }[];

  // This creates the relational link to the Category!
  @Prop({ type: Types.ObjectId, ref: 'CategoryEntity', required: true })
  categoryId: Types.ObjectId;
}
export const ProductSchema = SchemaFactory.createForClass(ProductEntity);
