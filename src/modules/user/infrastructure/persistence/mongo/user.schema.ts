import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// MongoDB schema for storing user documents
@Schema({ timestamps: true })
export class UserDocument extends Document {
  @Prop({ required: true, unique: true })
  userId: string;

  @Prop({ required: true, unique: true })
  username: string; // 'unique: true' automatically creates an index here

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, unique: true })
  employeeId: string; // 'unique: true' automatically creates an index here

  @Prop({ required: true, enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'LOCKED'] })
  status: string;

  @Prop()
  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(UserDocument);

// REMOVED: UserSchema.index({ username: 1 });
// REMOVED: UserSchema.index({ employeeId: 1 });
// These are redundant because of the 'unique: true' property above.
