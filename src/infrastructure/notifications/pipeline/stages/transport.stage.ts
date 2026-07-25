import { Injectable, Logger } from '@nestjs/common';
import { InfrastructureException } from 'src/common/exceptions/infrastructure.exception';
import { NotificationErrorCode } from 'src/common/constants/error-codes.generated';
import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';
import { NotificationFactory } from '../../factory/notification.factory';
@Injectable()
export class TransportStage implements INotificationStage {
  private readonly logger = new Logger(TransportStage.name);

  constructor(private readonly notificationFactory: NotificationFactory) {}

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    this.logger.debug(
      `🚀 Transport Stage initiated for: ${context.notificationId}`,
    );

    // 1. Ask the Factory for the correct adapter
    const provider = this.notificationFactory.getProvider(context);

    // 2. Health check (using your isAvailable interface method)
    const isReady = await provider.isAvailable();
    if (!isReady) {
      throw new InfrastructureException(
        `Provider for ${context.type} is offline.`,
        NotificationErrorCode.PROVIDER_UNAVAILABLE,
      );
    }

    // 3. Send the notification (using your sendNotification interface method)
    const result = await provider.sendNotification(context);

    // 4. Attach the final NotificationResult to the context metadata
    // so the TrackerStage (which is wrapping us) can read it.
    context.metadata = {
      ...context.metadata,
      providerUsed: result.provider,
      result: result, // Pass the whole object!
    };

    // 5. If it failed, throw an error immediately so TrackerStage catches it
    if (result.status === 'failed') {
      throw new InfrastructureException(
        `Provider failed to deliver: ${result.error}`,
        NotificationErrorCode.DELIVERY_FAILED,
      );
    }

    // Move to the end of the pipeline
    await next();
  }
}
