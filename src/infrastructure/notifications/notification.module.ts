import { Module, Logger, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Redis from 'ioredis';

// 1. Core Interfaces & Tokens
import { NOTIFICATION_TRACKER } from './core/interfaces/notification-tracker.interface';

// 2. Queue & Dispatcher
import { NotificationDispatcher } from './queue/notification.dispatcher';

// 3. Webhook Controller
import { NotificationWebhookController } from './module/notification-webhook.controller';

// 4. Factory & Providers
import { NotificationFactory } from './factory/notification.factory';
import { GmailAdapter } from './providers/email/gmail.adapter';
import { ResendAdapter } from './providers/email/resend.adapter';

// 5. Pipeline Engine
import { NotificationPipeline } from './pipeline/notification.pipeline';
import {
  NotificationLog,
  NotificationLogSchema,
} from './persistence/mongo/notification-log.schema';
import { NotificationDbService } from './persistence/mongo/notification-db.service';

// 6. Pipeline Stages
import { ValidateStage } from './pipeline/stages/validator.stage';
import { EnricherStage } from './pipeline/stages/enricher.stage';
import { DeduplicationStage } from './pipeline/stages/deduplication.stage';
import { RateLimiterStage } from './pipeline/stages/rate-limiter.stage';
import { TemplateCompilerStage } from './pipeline/stages/template-compiler.stage';
import { TrackerStage } from './pipeline/stages/tracker.stage';
import { TransportStage } from './pipeline/stages/transport.stage';

// 7. Your Database Service (Adjust this import to point to your actual DB service)
// import { NotificationDbService } from './tracking/notification-db.service';

@Global() // Optional: Makes the Dispatcher available everywhere without importing the module constantly
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: NotificationLog.name, schema: NotificationLogSchema },
    ]),
  ],
  controllers: [NotificationWebhookController],
  providers: [
    Logger,

    // 👉 REDIS INJECTION
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return new Redis(config.getOrThrow<string>('REDIS_URL'));
      },
    },

    // 👉 DATABASE TRACKER MAPPING
    {
      provide: NOTIFICATION_TRACKER,
      // useClass: NotificationDbService, // Map your actual MongoDB/Prisma service here
      useClass: NotificationDbService,
    },

    // 👉 PROVIDERS & FACTORY
    GmailAdapter,
    ResendAdapter,
    NotificationFactory,

    // 👉 STAGES (Must be provided so Nest can inject them into the Pipeline)
    ValidateStage,
    EnricherStage,
    DeduplicationStage,
    RateLimiterStage,
    TemplateCompilerStage,
    TrackerStage,
    TransportStage,

    // 👉 THE PIPELINE ENGINE
    NotificationPipeline,

    // 👉 THE DISPATCHER (What the rest of the app calls)
    NotificationDispatcher,
  ],
  exports: [
    // We only export the Dispatcher.
    // AuthModule and UploadModule don't need to know about the pipeline or Gmail.
    // They just need to dispatch tasks. This is perfect encapsulation.
    NotificationDispatcher,
  ],
})
export class NotificationModule {}
