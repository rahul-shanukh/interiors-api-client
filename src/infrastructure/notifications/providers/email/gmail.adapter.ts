// src/infrastructure/notifications/providers/email/gmail.adapter.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { INotificationProvider } from '../../core/interfaces/notification-provider.interface';
import { NotificationContext } from '../../core/types/notification-context.types';
import { NotificationResult } from '../../core/interfaces/notification.interface';

@Injectable() // 👈 FIX 1: This is mandatory for NestJS to inject ConfigService
export class GmailAdapter implements INotificationProvider {
  private readonly logger = new Logger(GmailAdapter.name);
  private transporter?: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {}

  private getTransporter(): nodemailer.Transporter {
    if (this.transporter) {
      return this.transporter;
    }

    const user = this.configService.get<string>('GMAIL_USER');
    const pass = this.configService.get<string>('GMAIL_APP_PASSWORD');

    if (!user || !pass) {
      throw new Error('Gmail SMTP credentials are not configured');
    }

    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });

    return this.transporter;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getTransporter().verify();
      return true;
    } catch (error) {
      this.logger.error(`Gmail SMTP connection failed: ${error}`);
      return false;
    }
  }

  async sendNotification(
    context: NotificationContext,
  ): Promise<NotificationResult> {
    try {
      this.logger.debug(
        '📧 Context received:',
        JSON.stringify(context, null, 2),
      );

      const toEmail = context.recipient.email;
      if (!toEmail) throw new Error('Email recipient is missing');

      // Pull the HTML that the TemplateCompilerStage created
      const htmlContent = context.metadata?.compiledBody;
      this.logger.debug(`To: ${toEmail}, HasTemplate: ${!!htmlContent}`);

      if (!htmlContent) {
        throw new Error('Compiled template body is missing from context');
      }

      const info = await this.getTransporter().sendMail({
        from: `"JC Interiors" <${this.configService.get<string>('GMAIL_USER')}>`,
        to: toEmail,
        subject: context.subject || 'Notification from JC Interiors',
        html: htmlContent,
      });

      this.logger.log(`✅ SMTP Success: ${info.response}`);

      this.logger.debug(`Email sent via Gmail. [MessageID: ${info.messageId}]`);

      return {
        notificationId: context.notificationId,
        status: 'delivered', // Must match your NotificationStatus enum/type
        provider: 'gmail',
        sentAt: new Date(),
      };
    } catch (error) {
      this.logger.error(`Gmail Adapter failed to send email: ${error}`);

      return {
        notificationId: context.notificationId,
        status: 'failed',
        provider: 'gmail',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
