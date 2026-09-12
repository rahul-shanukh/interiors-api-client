// src/infrastructure/notifications/pipeline/stages/enricher.stage.ts

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';

@Injectable()
export class EnricherStage implements INotificationStage {
  private readonly logger = new Logger(EnricherStage.name);

  constructor(private readonly configService: ConfigService) {}

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    // 1. Defensive Initialization
    // Ensure templateData exists so we don't crash when attaching globals
    context.templateData = context.templateData || {};
    context.metadata = context.metadata || {};

    // 2. Global Branding & Environment Injection
    // Now your .hbs files can safely use {{global.companyName}} and {{global.appUrl}}
    context.templateData.global = {
      companyName: 'JC Interiors',
      supportEmail: this.configService.get<string>(
        'SUPPORT_EMAIL',
        'support@jcinteriors.com',
      ),
      appUrl: this.configService.get<string>(
        'FRONTEND_URL',
        'http://localhost:5173',
      ),
      currentYear: new Date().getFullYear(),
    };

    // 3. Metadata Tracking for Analytics
    context.metadata = {
      ...context.metadata,
      enrichedAt: new Date().toISOString(),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
    };

    this.logger.log({
      event: 'notification_enriched',
      notificationId: context.notificationId,
      traceId: context.traceId, // 🔒 Strictly trusting the Edge Gateway
      templateName: context.templateName,
    });

    // Proceed to DeduplicationStage
    await next();
  }
}
