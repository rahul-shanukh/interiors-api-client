import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";

@Schema({ timestamps: true, collection: "idempotency_records" })
export class IdempotencyRecord {
  @Prop({ required: true })
  scope!: string;

  @Prop({ required: true })
  operation!: string;

  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  requestFingerprint!: string;

  @Prop({ required: true, enum: ["PROCESSING", "COMPLETED"] })
  status!: "PROCESSING" | "COMPLETED";

  @Prop({ type: Object })
  result?: Record<string, unknown>;

  @Prop({ required: true, expires: 0 })
  expiresAt!: Date;
}

export type IdempotencyRecordDocument = HydratedDocument<IdempotencyRecord>;
export const IdempotencyRecordSchema =
  SchemaFactory.createForClass(IdempotencyRecord);

IdempotencyRecordSchema.index(
  { scope: 1, operation: 1, key: 1 },
  { unique: true, name: "idempotency_scope_operation_key_unique" },
);
