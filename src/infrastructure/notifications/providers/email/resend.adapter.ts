import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { INotificationProvider } from '../../core/interfaces/notification-provider.interface';
import { NotificationContext } from '../../core/types/notification-context.types';
import { NotificationResult } from '../../core/interfaces/notification.interface';

@Injectable()
export class ResendAdapter implements INotificationProvider {
  private readonly logger = new Logger(ResendAdapter.name);
  private client?: Resend;

  constructor(private readonly configService: ConfigService) {}

  private getClient(): Resend {
    if (this.client) {
      return this.client;
    }

    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    this.client = new Resend(apiKey);
    return this.client;
  }

  async isAvailable(): Promise<boolean> {
    try {
      this.getClient();

      const fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL');
      if (!fromEmail) {
        throw new Error('RESEND_FROM_EMAIL is not configured');
      }

      return true;
    } catch (error) {
      this.logger.error(`Resend configuration check failed: ${error}`);
      return false;
    }
  }

  async sendNotification(
    context: NotificationContext,
  ): Promise<NotificationResult> {
    try {
      const toEmail = context.recipient.email;
      if (!toEmail) {
        throw new Error('Email recipient is missing');
      }

      const htmlContent = context.metadata?.compiledBody;
      if (!htmlContent) {
        throw new Error('Compiled template body is missing from context');
      }

      const fromEmail =
        this.configService.getOrThrow<string>('RESEND_FROM_EMAIL');

      const { data, error } = await this.getClient().emails.send({
        from: fromEmail,
        to: [toEmail],
        subject: context.subject || 'Notification from JC Interiors',
        html: htmlContent,
        tags: [
          {
            name: 'notification_id',
            value: context.notificationId,
          },
          {
            name: 'category',
            value: context.category,
          },
        ],
      });

      if (error) {
        throw new Error(error.message);
      }

      this.logger.log(`Email sent via Resend. [MessageID: ${data?.id}]`);

      return {
        notificationId: context.notificationId,
        status: 'delivered',
        provider: 'resend',
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Resend Adapter failed to send email: ${error}`);

      return {
        notificationId: context.notificationId,
        status: 'failed',
        provider: 'resend',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
