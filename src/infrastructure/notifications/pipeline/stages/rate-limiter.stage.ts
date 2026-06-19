// src/infrastructure/notifications/pipeline/stages/rate-limiter.stage.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { ApplicationException } from 'src/common/exceptions/application.exception';
import { NotificationErrorCode } from 'src/common/constants/error-codes.generated';
import Redis from 'ioredis';
import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';
import {
  MAX_EMAILS_PER_USER_PER_HOUR,
  MAX_MARKETING_EMAILS_PER_USER_PER_DAY,
} from '../../constants/notification.constants';

@Injectable()
export class RateLimiterStage implements INotificationStage {
  private readonly logger = new Logger(RateLimiterStage.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    try {
      // 1. Determine Limits dynamically from your Constants
      let limit = 20; // Default fallback limit
      let windowSeconds = 3600; // Default 1 hour

      if (context.category?.toLowerCase() === 'marketing') {
        limit = MAX_MARKETING_EMAILS_PER_USER_PER_DAY;
        windowSeconds = 86400; // 24 hours
      } else if (context.type?.toLowerCase() === 'email') {
        limit = MAX_EMAILS_PER_USER_PER_HOUR;
        windowSeconds = 3600; // 1 hour
      }

      const category = context.category || 'default';

      // 2. THE IDENTIFIER FIX
      // 1. Try User ID (For Employees/Admins)
      // 2. Try Email (For Anonymous Clients - lowercased to prevent bypassing limits)
      // 3. Try Phone (For Anonymous Clients requesting SMS quotes)
      const identifier =
        context.recipient.userId ||
        context.recipient.email?.toLowerCase() ||
        context.recipient.phone;

      if (!identifier) {
        this.logger.warn(
          `No identity found for Rate Limiter on Notification ${context.notificationId}`,
        );
        return await next();
      }

      // Redis now tracks the exact identity, whether user, email, or phone
      const redisKey = `notify:limit:${category}:${identifier}`;

      // We use Redis Pipeline to execute INCR and EXPIRE atomically
      const multi = this.redis.pipeline();
      multi.incr(redisKey);

      const results = await multi.exec();
      if (!results)
        throw new ApplicationException(
          'Redis pipeline failed',
          NotificationErrorCode.RATE_LIMITED,
        );

      const count = results[0][1] as number;

      // If this is the very first request, set the expiration window
      if (count === 1) {
        // 👉 Using your dynamic windowSeconds here!
        await this.redis.expire(redisKey, windowSeconds);
      }

      // 3. THE BOUNCER
      // 👉 Using your dynamic limit here!
      if (count > limit) {
        this.logger.warn({
          event: 'notification_rate_limited',
          notificationId: context.notificationId,
          identifier,
          category,
          count,
          limit, // Updated to use the dynamic limit
        });

        // KILL SWITCH: Silently drop the notification.
        throw new ApplicationException(
          `Rate limit exceeded for ${identifier}`,
          NotificationErrorCode.RATE_LIMITED,
        );
      }

      this.logger.debug(
        `Rate limit check passed. [Category: ${category}, Count: ${count}/${limit}]`,
      );
      await next();
    } catch (error) {
      // RESILIENCE (Fail-Open):
      this.logger.error({
        event: 'rate_limiter_failed_open',
        notificationId: context.notificationId,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Proceed to the next stage
  }
}
