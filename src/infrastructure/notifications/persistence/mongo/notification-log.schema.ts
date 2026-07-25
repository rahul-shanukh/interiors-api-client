// src/infrastructure/notifications/persistence/mongo/notification-log.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type {
  NotificationStatus,
  NotificationProvider,
} from '../../core/types/notification.types';

@Schema({ timestamps: true, collection: 'notification_logs' })
export class NotificationLog extends Document {
  @Prop({ required: true, index: true })
  notificationId!: string; // 👈 Notice the !

  @Prop({ index: true })
  traceId!: string;

  @Prop({ index: true })
  recipientId!: string;

  @Prop()
  recipientContact!: string;

  @Prop({ required: true })
  type!: string;

  @Prop()
  category!: string;

  @Prop()
  templateName!: string;

  @Prop({ required: true, default: 'PENDING' })
  status!: NotificationStatus;

  @Prop()
  provider!: NotificationProvider;

  @Prop({ type: Object })
  errorDetails!: any;

  @Prop()
  sentAt!: Date;
}

export const NotificationLogSchema =
  SchemaFactory.createForClass(NotificationLog);
