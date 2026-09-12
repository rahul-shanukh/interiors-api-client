// notification.pipeline.ts
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ValidateStage } from './stages/validator.stage';
import { EnricherStage } from './stages/enricher.stage';
import { DeduplicationStage } from './stages/deduplication.stage';
import { RateLimiterStage } from './stages/rate-limiter.stage';
import { TemplateCompilerStage } from './stages/template-compiler.stage';
import { TrackerStage } from './stages/tracker.stage';
import { TransportStage } from './stages/transport.stage';
import { INotificationStage } from '../core/interfaces/notification-stage.interface';
import { NotificationContext } from '../core/types/notification-context.types';

@Injectable()
export class NotificationPipeline implements OnModuleInit {
  private readonly logger = new Logger(NotificationPipeline.name);
  private readonly stages: INotificationStage[] = [];

  constructor(
    private readonly validateStage: ValidateStage,
    private readonly enricherStage: EnricherStage,
    private readonly deduplicationStage: DeduplicationStage,
    private readonly rateLimiterStage: RateLimiterStage,
    private readonly templateCompilerStage: TemplateCompilerStage,
    private readonly trackerStage: TrackerStage,
    private readonly transportStage: TransportStage,
  ) {}

  onModuleInit() {
    this.use(this.validateStage)
      .use(this.enricherStage)
      .use(this.deduplicationStage)
      .use(this.rateLimiterStage)
      .use(this.templateCompilerStage)
      .use(this.trackerStage)
      .use(this.transportStage);

    this.logger.log(
      `✅ Pipeline initialized with ${this.stages.length} stages`,
    );
  }

  use(stage: INotificationStage): this {
    this.stages.push(stage);
    return this;
  }

  async execute(context: NotificationContext): Promise<void> {
    this.logger.log({
      event: 'pipeline started',
      notificationId: context.notificationId,
      type: context.type,
      category: context.category,
      priority: context.priority,
      traceId: context.traceId,
    });

    const runner = async (index: number): Promise<void> => {
      if (index >= this.stages.length) return;

      const stage = this.stages[index];

      this.logger.log({
        event: 'stage_executing',
        stage: stage.constructor.name,
        notificationId: context.notificationId,
        traceId: context.traceId,
      });

      await stage.execute(context, () => runner(index + 1));
    };

    await runner(0);

    this.logger.log({
      event: 'pipeline_completed',
      notificationId: context.notificationId,
      traceId: context.traceId,
    });
  }
}
