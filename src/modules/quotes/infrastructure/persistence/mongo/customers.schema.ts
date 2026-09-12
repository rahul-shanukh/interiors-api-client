//src/modules/quotes/infrastructure/persistence/mongo/customers.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

/**
 * Canonical customer profile for public quote requests.
 *
 * Email is normalized before storage and is unique, so repeated quote requests
 * from the same email resolve to the same Customer document.
 */
@Schema({
  timestamps: true,
  collection: "customers",
})
export class Customer {
  /**
   * Server-generated HMAC of the normalized email. This is the stable join key
   * shared by Customer, Quote, and CustomerQuoteStats documents.
   */
  @Prop({ required: true, unique: true, index: true, immutable: true })
  customerKey!: string;

  @Prop({
    required: true,
    unique: true,
    index: true,
    immutable: true,
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true })
  phone!: string;
}

export type CustomerDocument = HydratedDocument<Customer>;

export const CustomerSchema = SchemaFactory.createForClass(Customer);
