// src/infrastructure/notifications/core/interfaces/notification-stage.interface.ts

import type { NotificationContext } from '../types/notification-context.types';

export interface INotificationStage {
  execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void>;
}
