import { Injectable, Inject, Logger } from '@nestjs/common';
import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';
import {
  type INotificationTracker,
  NOTIFICATION_TRACKER,
} from '../../core/interfaces/notification-tracker.interface';
import { NotificationResult } from '../../core/interfaces/notification.interface';

@Injectable()
export class TrackerStage implements INotificationStage {
  private readonly logger = new Logger(TrackerStage.name);

  constructor(
    // 👉 Injecting your exact interface token!
    @Inject(NOTIFICATION_TRACKER)
    private readonly tracker: INotificationTracker,
  ) {}

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    // 1. Record the attempt BEFORE the email is actually sent
    await this.tracker.recordAttempt(context);

    try {
      // 2. Execute the next stage (which will be TransportStage)
      await next();

      // 3. If next() finishes without errors, TransportStage was successful.
      // We grab the result that TransportStage attached to the metadata.
      const result = context.metadata.result as NotificationResult;

      if (result) {
        await this.tracker.recordResult(context, result);
        this.logger.debug(
          `Delivery SUCCESS recorded for ${context.notificationId}`,
        );
      }
    } catch (error) {
      // 4. If TransportStage throws an error (e.g., Gmail is down), catch it here!
      const failedResult: NotificationResult = {
        notificationId: context.notificationId,
        status: 'FAILED' as any, // Typecast to your NotificationStatus enum
        provider: (context.metadata?.providerUsed as any) || 'UNKNOWN',
        error: error instanceof Error ? error.message : String(error),
        sentAt: new Date(),
      };

      await this.tracker.recordResult(context, failedResult);
      this.logger.error(
        `Delivery FAILURE recorded for ${context.notificationId}`,
      );

      // 🚨 Re-throw the error so Google Cloud Tasks knows to retry this job!
      throw error;
    }
  }
}
