import { Injectable, Logger } from '@nestjs/common';
import { InfrastructureException } from 'src/common/exceptions/infrastructure.exception';
import { NotificationErrorCode } from 'src/common/constants/error-codes.generated';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';

@Injectable()
export class TemplateCompilerStage implements INotificationStage {
  private readonly logger = new Logger(TemplateCompilerStage.name);

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    try {
      if (context.type?.toLowerCase() === 'email') {
        // Construct path using your exact folder structure
        const templatePath = path.join(
          process.cwd(),
          'src',
          'infrastructure',
          'notifications',
          'templates',
          'email',
          `${context.templateName}.hbs`, // e.g., 'auth/otp.hbs' coming from your constants
        );

        const templateSource = await fs.readFile(templatePath, 'utf8');
        const compiledHtml = handlebars.compile(templateSource)(
          context.templateData,
        );

        // Save the compiled HTML into metadata so the Adapter can use it
        context.metadata.compiledBody = compiledHtml;

        this.logger.debug(
          `Email Handlebars template compiled for ${context.notificationId}`,
        );
      }

      if (context.type?.toLowerCase() === 'sms') {
        // SMS doesn't need HTML, just simple text replacement
        const templatePath = path.join(
          process.cwd(),
          'src',
          'infrastructure',
          'notifications',
          'templates',
          'sms',
          `${context.templateName}.txt`,
        );

        const templateSource = await fs.readFile(templatePath, 'utf8');
        // Simple string replacement or Handlebars for text
        const compiledText = handlebars.compile(templateSource)(
          context.templateData,
        );

        context.metadata.compiledBody = compiledText;
        this.logger.debug(
          `SMS text template compiled for ${context.notificationId}`,
        );
      }
      await next();
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.logger.error(`Template file not found: ${context.templateName}`);
        throw new InfrastructureException(
          `Template file not found: ${context.templateName}`,
          NotificationErrorCode.TEMPLATE_NOT_FOUND,
        );
      }
      this.logger.error(
        `Failed to compile template ${context.templateName}: ${error}`,
      );
      throw new InfrastructureException(
        `Failed to compile template: ${context.templateName}`,
        NotificationErrorCode.TEMPLATE_COMPILE_FAILED,
      );
    }
  }
}
