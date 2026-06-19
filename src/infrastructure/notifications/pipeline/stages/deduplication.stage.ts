// src/infrastructure/notifications/pipeline/stages/deduplication.stage.ts

import { Injectable, Inject, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';

import { INotificationStage } from '../../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../../core/types/notification-context.types';

import { ApplicationException } from 'src/common/exceptions/application.exception';
import { InfrastructureException } from 'src/common/exceptions/infrastructure.exception';

import { NotificationErrorCode } from 'src/common/constants/error-codes.generated';

@Injectable()
export class DeduplicationStage implements INotificationStage {
  private readonly logger = new Logger(DeduplicationStage.name);

  /**
   * Final dedup window after successful delivery.
   */
  private readonly DEDUP_WINDOW_SECONDS = 300;

  /**
   * Short-lived processing lock to prevent parallel workers
   * from sending the same notification simultaneously.
   */
  private readonly PROCESSING_LOCK_SECONDS = 60;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async execute(
    context: NotificationContext,
    next: () => Promise<void>,
  ): Promise<void> {
    const fingerprint = this.generateFingerprint(context);

    const hash = createHash('sha256').update(fingerprint).digest('hex');

    const recipient = context.recipient.userId || context.recipient.email;

    const dedupKey = `notify:dedup:${recipient}:${hash}`;

    const processingKey = `notify:processing:${recipient}:${hash}`;

    let processingLockAcquired = false;

    // ==========================================
    // PHASE 1: DUPLICATE CHECK
    // ==========================================
    try {
      /**
       * If final dedup key exists,
       * notification already delivered successfully.
       */
      const alreadyDelivered = await this.redis.exists(dedupKey);

      if (alreadyDelivered) {
        this.logger.warn({
          event: 'notification_deduplicated',
          notificationId: context.notificationId,
          dedupKey,
          reason: 'Duplicate payload detected within deduplication window',
        });

        throw new ApplicationException(
          'Duplicate notification detected within 5-minute window',
          NotificationErrorCode.DUPLICATE_DETECTED,
        );
      }

      /**
       * Atomic distributed lock.
       *
       * Prevents race conditions:
       *
       * Worker A and Worker B cannot both proceed simultaneously.
       */
      const lockResult = await this.redis.set(
        processingKey,
        'processing',
        'EX',
        this.PROCESSING_LOCK_SECONDS,
        'NX',
      );

      if (lockResult !== 'OK') {
        this.logger.warn({
          event: 'notification_already_processing',
          notificationId: context.notificationId,
          processingKey,
        });

        throw new ApplicationException(
          'Notification is already being processed',
          NotificationErrorCode.DUPLICATE_DETECTED,
        );
      }

      processingLockAcquired = true;
    } catch (error) {
      /**
       * Fail-open strategy.
       *
       * If Redis itself is failing,
       * continue pipeline rather than dropping notifications.
       */
      if (error instanceof ApplicationException) {
        throw error;
      }

      this.logger.error({
        event: 'deduplication_check_failed_open',
        notificationId: context.notificationId,
        error: error instanceof Error ? error.message : String(error),
        action: 'Proceeding without deduplication protection',
      });
    }

    // ==========================================
    // PIPELINE EXECUTION
    // ==========================================
    try {
      this.logger.debug({
        event: 'deduplication_passed',
        notificationId: context.notificationId,
      });

      /**
       * Execute downstream stages.
       *
       * If this throws:
       * - no dedup key committed
       * - GCP retry can safely retry
       */
      await next();

      // ==========================================
      // PHASE 3: FINAL DELIVERY COMMIT
      // ==========================================
      try {
        /**
         * Only commit dedup AFTER successful delivery.
         *
         * This preserves retry correctness.
         */
        await this.redis.set(
          dedupKey,
          'delivered',
          'EX',
          this.DEDUP_WINDOW_SECONDS,
        );

        this.logger.debug({
          event: 'deduplication_committed',
          notificationId: context.notificationId,
          dedupKey,
        });
      } catch (error) {
        /**
         * Email already delivered successfully.
         *
         * Dedup cache failure should not fail pipeline.
         */
        this.logger.error({
          event: 'deduplication_commit_failed',
          notificationId: context.notificationId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    } finally {
      // ==========================================
      // PHASE 4: CLEANUP PROCESSING LOCK
      // ==========================================
      if (processingLockAcquired) {
        try {
          await this.redis.del(processingKey);
        } catch (error) {
          this.logger.error({
            event: 'processing_lock_cleanup_failed',
            notificationId: context.notificationId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  /**
   * Generates deterministic payload fingerprint.
   */
  private generateFingerprint(context: NotificationContext): string {
    const payload = {
      type: context.type,
      template: context.templateName,
      recipient: context.recipient.userId || context.recipient.email,
      data: this.sortObjectKeys(context.templateData || {}),
    };

    return JSON.stringify(payload);
  }

  /**
   * Deterministic deep key sorting.
   *
   * Prevents:
   * - payload ordering inconsistencies
   * - recursion overflow
   * - circular reference crashes
   */
  private sortObjectKeys(root: any): any {
    const MAX_DEPTH = 50;

    const seen = new WeakSet();

    if (root === null || typeof root !== 'object') {
      return root;
    }

    const resultRoot = Array.isArray(root) ? [] : {};

    const stack = [
      {
        original: root,
        target: resultRoot,
        depth: 0,
      },
    ];

    while (stack.length > 0) {
      const current = stack.pop()!;

      const { original, target, depth } = current;

      if (depth > MAX_DEPTH) {
        throw new InfrastructureException(
          `Notification payload exceeded max nesting depth of ${MAX_DEPTH}`,
          NotificationErrorCode.INVALID_CONTEXT,
        );
      }

      if (typeof original === 'object' && original !== null) {
        if (seen.has(original)) {
          continue;
        }

        seen.add(original);
      }

      const keys = Object.keys(original).sort();

      for (const key of keys) {
        const value = original[key];

        if (value !== null && typeof value === 'object') {
          const nextTarget = Array.isArray(value) ? [] : {};

          (target as any)[key] = nextTarget;

          stack.push({
            original: value,
            target: nextTarget,
            depth: depth + 1,
          });
        } else {
          (target as any)[key] = value;
        }
      }
    }

    return resultRoot;
  }
}
