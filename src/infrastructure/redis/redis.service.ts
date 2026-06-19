import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  // Singleton Redis client instance
  private client!: Redis;

  constructor(private config: ConfigService) {}

  onModuleInit() {
    this.getClient();
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log('🔌 Disconnecting from Redis (Graceful Shutdown)');
      this.client.quit();
    }
  }

  getClient(): Redis {
    if (this.client) {
      return this.client;
    }

    // Read Redis URL from environment variables
    const redisUrl = this.config.get<string>('REDIS_URL');

    // PRODUCTION MODE
    if (redisUrl) {
      this.logger.log('🚀 Connecting to Production Redis');

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
      });

      return this.client;
    }
    //DEVELOPMENT MODE

    this.logger.log('🐳 Connecting to Local Redis (Docker/Localhost)');

    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST'),
      port: this.config.get<number>('REDIS_PORT'),
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
    });

    return this.client;
  }
}
