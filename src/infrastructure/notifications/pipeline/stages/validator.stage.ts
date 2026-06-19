import { Injectable, Logger } from '@nestjs/common';
import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';
import { DomainException } from 'src/common/exceptions/domain.exception';
import { NotificationErrorCode } from 'src/common/constants/error-codes.generated';

@Injectable()
export class ValidateStage implements INotificationStage {
  private readonly logger = new Logger(ValidateStage.name);

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    if (!context.templateName) {
      throw new DomainException(
        'Notification template name is missing',
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    if (!context.recipient.userId) {
      throw new DomainException(
        'Recipient userId is required',
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    const type = context.type?.toLowerCase();

    if (type === 'email') {
      if (!context.recipient.email) {
        throw new DomainException(
          'Email recipient is missing',
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
      if (!this.isValidEmail(context.recipient.email)) {
        throw new DomainException(
          `Invalid email address: ${context.recipient.email}`,
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
    }

    if (type === 'sms') {
      if (!context.recipient.phone) {
        throw new DomainException(
          'Phone number is missing for SMS notification',
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
    }

    if (type === 'push') {
      if (!context.recipient.deviceToken) {
        throw new DomainException(
          'Device token is missing for push notification',
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
    }

    this.logger.log({
      event: 'validation_passed',
      notificationId: context.notificationId,
      type: context.type,
      traceId: context.traceId,
    });

    await next();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
