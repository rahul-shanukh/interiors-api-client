// backend\src\infrastructure\notifications\queue\notification.dispatcher.ts

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CloudTasksClient } from "@google-cloud/tasks";
import { NotificationContext } from "../core/types/notification-context.types";

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);
  private readonly client: CloudTasksClient;

  constructor(private readonly configService: ConfigService) {
    this.client = new CloudTasksClient();
  }

  async dispatch(context: NotificationContext): Promise<void> {
    const projectId = this.configService.getOrThrow<string>("GCP_PROJECT_ID");
    const location =
      this.configService.getOrThrow<string>("GCP_QUEUE_LOCATION");

    // Sort priority to the correct Google Cloud Queue based on your constants
    const queue =
      context.priority === "high" ? "notifications-high" : "notifications"; // Uses your standard queue name

    const appUrl = this.configService.getOrThrow<string>("API_BASE_URL");
    // const serviceAccountEmail = this.configService.getOrThrow<string>(
    //   'GCP_SERVICE_ACCOUNT_EMAIL',
    // );

    const parent = this.client.queuePath(projectId, location, queue);
    const url = `${appUrl}/api/v1/internal/tasks/process-notification`;

    const payload = Buffer.from(JSON.stringify(context)).toString("base64");

    try {
      const [response] = await this.client.createTask({
        parent,
        task: {
          httpRequest: {
            httpMethod: "POST",
            url,
            body: payload,
            headers: {
              "Content-Type": "application/json",
            },
            // 🔒 The OIDC token ensures only Google can trigger this endpoint
            // oidcToken: {
            //   serviceAccountEmail,
            // },
          },
        },
      });

      this.logger.log({
        event: "task_dispatched_to_gcp",
        notificationId: context.notificationId,
        taskId: response.name,
      });
    } catch (error) {
      this.logger.error(
        `Failed to dispatch notification task to GCP: ${error}`,
      );
      throw error;
    }
  }
}
