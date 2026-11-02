// src/modules/user/infrastructure/persistence/mongo/user.schema.ts

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";
import { UserStatus } from "../../../domain/entities/user.entity";

@Schema({ timestamps: true })
export class UserDocument {
  @Prop({
    type: String,
    required: true,
    unique: true,
    immutable: true,
    trim: true,
  })
  userId!: string; // Firebase UID

  @Prop({
    type: String,
    required: true,
    unique: true,
    trim: true,
  })
  username!: string;

  @Prop({
    type: String,
    trim: true,
    lowercase: true,
  })
  email?: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  emailVerified!: boolean;

  @Prop({
    type: String,
    trim: true,
  })
  phone?: string;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  phoneVerified!: boolean;

  @Prop({
    type: Boolean,
    required: true,
    default: false,
  })
  whatsappUpdates!: boolean;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(UserStatus),
  })
  status!: UserStatus;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  createdAt!: Date;
  updatedAt!: Date;
}

export type UserHydratedDocument = HydratedDocument<UserDocument>;

export const UserSchema = SchemaFactory.createForClass(UserDocument);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      emailVerified: true,
      email: { $type: "string" },
    },
  },
);

UserSchema.index(
  { phone: 1 },
  {
    unique: true,
    partialFilterExpression: {
      phoneVerified: true,
      phone: { $type: "string" },
    },
  },
);