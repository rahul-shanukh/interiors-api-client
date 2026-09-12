// src/infrastructure/notifications/core/interfaces/notification-tracker.interface.ts

import type { NotificationContext } from '../types/notification-context.types';
import type { NotificationResult } from './notification.interface';

export interface INotificationTracker {
  recordAttempt(context: NotificationContext): Promise<void>;
  recordResult(
    context: NotificationContext,
    result: NotificationResult,
  ): Promise<void>;
  getDeliveryHistory(userId: string): Promise<NotificationContext[]>;
}

export const NOTIFICATION_TRACKER = 'NOTIFICATION_TRACKER';
