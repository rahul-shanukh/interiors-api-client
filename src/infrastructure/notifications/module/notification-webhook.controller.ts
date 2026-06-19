// backend\src\infrastructure\notifications\module\notification-webhook.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import type { NotificationContext } from '../core/types/notification-context.types';
import { NotificationPipeline } from '../pipeline/notification.pipeline';
import { Public } from 'src/common/decorators/roles.decorator'; // 1. Import your Public decorator

@Controller('internal/tasks')
export class NotificationWebhookController {
  private readonly logger = new Logger(NotificationWebhookController.name);

  constructor(private readonly pipeline: NotificationPipeline) {}

  @Public() // 2. Add this to bypass global JWT/Auth guards during local testing
  @Post('process-notification')
  @HttpCode(HttpStatus.OK)
  async processNotification(
    @Body() context: NotificationContext,
    @Headers('authorization') authHeader?: string,
    @Headers('x-cloudtasks-taskname') taskName?: string,
  ) {
    const isProduction = process.env.NODE_ENV === 'production';

    // 🔒 SECURITY: Only enforce the Google Cloud Token check in production
    if (isProduction) {
      if (!authHeader || !taskName) {
        this.logger.error('🚨 Unauthorized access attempt to Webhook');
        throw new UnauthorizedException('Missing Cloud Tasks identity');
      }
      // Note: In a full prod setup, you'd also verify the OIDC token here
    }

    this.logger.log(
      `📥 Received task from Google Cloud Tasks: ${taskName || 'local-manual-trigger'}`,
    );

    try {
      // 3. Optional: Log a snippet of the incoming data to verify the quote details
      this.logger.debug(
        `Processing ${context.type} for ${context.recipient.email}`,
      );

      // Push the context into our master defensive pipeline
      await this.pipeline.execute(context);

      return { success: true };
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`❌ Pipeline execution failed: ${error.message}`);
      } else {
        this.logger.error('❌ Pipeline execution failed with unknown error');
      }

      throw error;
    }
  }
}
