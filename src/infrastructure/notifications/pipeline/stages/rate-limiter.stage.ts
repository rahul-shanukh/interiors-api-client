// src/infrastructure/notifications/pipeline/stages/rate-limiter.stage.ts

import { Injectable, Logger } from "@nestjs/common";
import { ApplicationException } from "src/common/exceptions/application.exception";
import { NotificationErrorCode } from "src/common/constants/error-codes.generated";
import { INotificationStage } from "../../core/interfaces/notification-stage.interface";
import { NotificationContext } from "../../core/types/notification-context.types";
import {
  MAX_EMAILS_PER_USER_PER_HOUR,
  MAX_MARKETING_EMAILS_PER_USER_PER_DAY,
  EMAIL_RATE_LIMIT_WINDOW_SECONDS,
  MARKETING_RATE_LIMIT_WINDOW_SECONDS,
} from "../../constants/notification.constants";
import { CacheService } from "src/infrastructure/cache/cache.service";

@Injectable()
export class RateLimiterStage implements INotificationStage {
  private readonly logger = new Logger(RateLimiterStage.name);

  constructor(private readonly cacheService: CacheService) {}

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    try {
      // 1. Determine Limits dynamically from your Constants
      let limit = MAX_EMAILS_PER_USER_PER_HOUR; // Default fallback limit
      let windowSeconds = EMAIL_RATE_LIMIT_WINDOW_SECONDS; // Default 1 hour

      if (context.category?.toLowerCase() === "marketing") {
        limit = MAX_MARKETING_EMAILS_PER_USER_PER_DAY;
        windowSeconds = MARKETING_RATE_LIMIT_WINDOW_SECONDS; // 24 hours
      } else if (context.type?.toLowerCase() === "email") {
        limit = MAX_EMAILS_PER_USER_PER_HOUR;
        windowSeconds = EMAIL_RATE_LIMIT_WINDOW_SECONDS; // 1 hour
      }

      const category = context.category || "default";

      // 2. THE IDENTIFIER FIX
      // 1. Try User ID (For Employees/Admins)
      // 2. Try Email (For Anonymous Clients - lowercased to prevent bypassing limits)
      // 3. Try Phone (For Anonymous Clients requesting SMS quotes)
      const identifier =
        context.recipient.customerKey ||
        context.recipient.userId ||
        context.recipient.email?.trim().toLowerCase() ||
        context.recipient.phone;

      if (!identifier) {
        this.logger.warn(
          `No identity found for Rate Limiter on Notification ${context.notificationId}`,
        );
        return await next();
      }

      const cacheKey = `notify:limit:${category}:${identifier}`;

      // Use rolling-window rate limiting to prevent fixed-window boundary bursts

      const allowed = await this.cacheService.slidingWindowRateLimit(
        cacheKey,
        limit,
        windowSeconds,
      );

      // 3. THE BOUNCER
      // 👉 Using your dynamic limit here!
      if (!allowed) {
        this.logger.warn({
          event: "notification_rate_limited",
          notificationId: context.notificationId,
          identifier,
          category,
          limit,
        });

        // KILL SWITCH: Silently drop the notification.
        throw new ApplicationException(
          `Rate limit exceeded for ${identifier}`,
          NotificationErrorCode.RATE_LIMITED,
        );
      }

      this.logger.debug(
        `Rate limit check passed. [Category: ${category}, Allowed: ${allowed}, Limit: ${limit}, Window: ${windowSeconds}s, Identifier: ${identifier}]`,
      );

      await next();
    } catch (error) {
      if (error instanceof ApplicationException) {
        throw error; // Stop the pipeline
      }
      // RESILIENCE (Fail-Open):
      this.logger.error({
        event: "rate_limiter_failed_open",
        notificationId: context.notificationId,
        error: error instanceof Error ? error.message : String(error),
      });
      await next();
    }

    // Proceed to the next stage
  }
}
