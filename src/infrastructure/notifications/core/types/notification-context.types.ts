// src/infrastructure/notifications/core/types/notification-context.types.ts

import type {
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationStatus,
} from './notification.types';

export interface NotificationRecipient {
  email?: string;
  phone?: string;
  deviceToken?: string;
  name: string;
  userId: string;
}

export interface NotificationContext {
  // Identity
  notificationId: string; // unique per notification
  traceId: string; // from OTel — links to request

  // Routing
  type: NotificationType;
  priority: NotificationPriority;
  category: NotificationCategory;

  // Recipient
  recipient: NotificationRecipient;

  // Content
  subject?: string; // email only
  templateName: string; // maps to .hbs file
  templateData: Record<string, any>; // variables injected into template

  // Metadata
  status: NotificationStatus;
  attempts: number; // retry count
  scheduledAt?: Date; // for marketing/scheduled sends
  createdAt: Date;

  // Enriched by pipeline
  metadata: Record<string, any>;
}
