import { Injectable, Logger } from "@nestjs/common";
import { INotificationStage } from "../../core/interfaces/notification-stage.interface";
import { NotificationContext } from "../../core/types/notification-context.types";
import { DomainException } from "src/common/exceptions/domain.exception";
import { NotificationErrorCode } from "src/common/constants/error-codes.generated";

@Injectable()
export class ValidateStage implements INotificationStage {
  private readonly logger = new Logger(ValidateStage.name);

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    // 1. Notification identity / tracing
    if (!context.notificationId?.trim()) {
      throw new DomainException(
        "Notification ID is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    if (!context.traceId?.trim()) {
      throw new DomainException(
        "Trace ID is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    // 2. Routing data
    if (!context.type) {
      throw new DomainException(
        "Notification type is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    if (!context.priority) {
      throw new DomainException(
        "Notification priority is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    if (!context.category) {
      throw new DomainException(
        "Notification category is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    // 3. Template data
    if (!context.templateName?.trim()) {
      throw new DomainException(
        "Notification template name is missing",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    if (!context.templateData) {
      throw new DomainException(
        "Notification template data is missing",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    // 4. Recipient
    if (!context.recipient) {
      throw new DomainException(
        "Notification recipient is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    const customerKey = context.recipient.customerKey?.trim();
    const userId = context.recipient.userId?.trim();
    const email = context.recipient.email?.trim();
    const phone = context.recipient.phone?.trim();
    const deviceToken = context.recipient.deviceToken?.trim();
    const name = context.recipient.name?.trim();

    /*
     * Identity priority:
     * 1. customerKey -> canonical customer identity
     * 2. userId      -> secondary internal identity
     * 3. email       -> fallback
     * 4. phone       -> fallback
     *
     * notificationId is intentionally NOT part of identity.
     */

    if (!customerKey && !userId && !email && !phone && !deviceToken) {
      throw new DomainException(
        "Recipient identity is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    if (!name) {
      throw new DomainException(
        "Recipient name is required",
        NotificationErrorCode.INVALID_CONTEXT,
      );
    }

    const type = context.type.toLowerCase();

    // 5. Channel-specific validation
    if (type === "email") {
      if (!email) {
        throw new DomainException(
          "Email recipient is missing",
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }

      if (!this.isValidEmail(email)) {
        throw new DomainException(
          `Invalid email address: ${email}`,
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
    }

    if (type === "sms") {
      if (!phone) {
        throw new DomainException(
          "Phone number is missing for SMS notification",
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
    }

    if (type === "push") {
      if (!deviceToken) {
        throw new DomainException(
          "Device token is missing for push notification",
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }
    }

    this.logger.log({
      event: "validation_passed",
      notificationId: context.notificationId,
      customerKey: customerKey ?? undefined,
      userId: userId ?? undefined,
      type: context.type,
      traceId: context.traceId,
    });

    await next();
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
