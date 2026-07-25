import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { INotificationTracker } from "../../core/interfaces/notification-tracker.interface";
import { NotificationContext } from "../../core/types/notification-context.types";
import { NotificationResult } from "../../core/interfaces/notification.interface";
import { NotificationLog } from "./notification-log.schema";

@Injectable()
export class NotificationDbService implements INotificationTracker {
  private readonly logger = new Logger(NotificationDbService.name);

  constructor(
    @InjectModel(NotificationLog.name)
    private readonly logModel: Model<NotificationLog>,
  ) {}

  async recordAttempt(context: NotificationContext): Promise<void> {
    try {
      await this.logModel.create({
        notificationId: context.notificationId,
        traceId: context.traceId,
        recipientId: context.recipient.userId || "anonymous",
        recipientContact: context.recipient.email || context.recipient.phone,
        type: context.type,
        category: context.category,
        templateName: context.templateName,
        status: "PENDING",
      });
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update result for ${context.notificationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async recordResult(
    context: NotificationContext,
    result: NotificationResult,
  ): Promise<void> {
    try {
      await this.logModel.updateOne(
        { notificationId: context.notificationId },
        {
          $set: {
            status: result.status,
            provider: result.provider,
            errorDetails: result.error || null,
            sentAt: result.sentAt || new Date(),
          },
        },
      );
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update result for ${context.notificationId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async getDeliveryHistory(userId: string): Promise<any[]> {
    return this.logModel
      .find({ recipientId: userId })
      .sort({ createdAt: -1 })
      .exec();
  }
}
