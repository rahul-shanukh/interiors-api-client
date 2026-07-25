import { Injectable, Logger } from '@nestjs/common';
import { ApplicationException } from 'src/common/exceptions/application.exception';
import { NotificationErrorCode } from 'src/common/constants/error-codes.generated';
import { ConfigService } from '@nestjs/config';
import { INotificationProvider } from '../core/interfaces/notification-provider.interface';
import { NotificationContext } from '../core/types/notification-context.types';
import { GmailAdapter } from '../providers/email/gmail.adapter';
import { ResendAdapter } from '../providers/email/resend.adapter';

@Injectable()
export class NotificationFactory {
  private readonly logger = new Logger(NotificationFactory.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly gmailAdapter: GmailAdapter,
    private readonly resendAdapter: ResendAdapter,
  ) {}

  getProvider(context: NotificationContext): INotificationProvider {
    if (context.type?.toLowerCase() === 'email') {
      const emailProvider = this.configService
        .get<string>('EMAIL_PROVIDER', 'GMAIL')
        .toUpperCase();

      if (emailProvider === 'GMAIL') {
        return this.gmailAdapter;
      }

      if (emailProvider === 'RESEND') {
        return this.resendAdapter;
      }

      throw new ApplicationException(
        `Unknown Email Provider: ${emailProvider}`,
        NotificationErrorCode.PROVIDER_NOT_FOUND,
      );
    }

    if (context.type?.toLowerCase() === 'sms') {
      throw new ApplicationException(
        'SMS provider not yet implemented',
        NotificationErrorCode.PROVIDER_NOT_FOUND,
      );
    }

    throw new ApplicationException(
      `No provider routing found for type: ${context.type}`,
      NotificationErrorCode.PROVIDER_NOT_FOUND,
    );
  }
}
