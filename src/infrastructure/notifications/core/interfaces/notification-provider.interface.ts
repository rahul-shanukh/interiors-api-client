//backend\src\infrastructure\notifications\core\interfaces\notification-provider.interface.ts

import { NotificationContext } from '../types/notification-context.types';
import { NotificationResult } from './notification.interface';

export interface INotificationProvider {
  isAvailable(): Promise<boolean>;
  sendNotification(context: NotificationContext): Promise<NotificationResult>;
}

export const NOTIFICATION_PROVIDER = 'NOTIFICATION_PROVIDER';
