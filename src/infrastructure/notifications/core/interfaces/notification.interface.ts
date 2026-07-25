//backend\src\infrastructure\notifications\core\interfaces\notification.interface.ts

import { NotificationContext } from '../types/notification-context.types';
import {
  NotificationProvider,
  NotificationStatus,
} from '../types/notification.types';

export interface NotificationResult {
  notificationId: string;
  status: NotificationStatus;
  provider: NotificationProvider;
  sentAt?: Date;
  error?: unknown;
}

export interface INotificationService {
  sendNotification(context: NotificationContext): Promise<NotificationResult>;
}

export const NOTIFICATION_SERVICE = 'NOTIFICATION_SERVICE';
