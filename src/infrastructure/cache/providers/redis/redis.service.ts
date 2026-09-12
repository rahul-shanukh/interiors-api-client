import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  // Singleton Redis client instance
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const activeProvider = this.config
      .get<string>("CACHE_PROVIDER")
      ?.toLowerCase();

    if (activeProvider !== "redis") {
      this.logger.log(
        "⏸️ Redis is not the active cache provider. Skipping connection.",
      );
      return; // EXIT EARLY! Do not connect.
    }
    this.initializeClient();
  }

  onModuleDestroy() {
    if (this.client) {
      this.logger.log("🔌 Disconnecting from Redis (Graceful Shutdown)");
      this.client.quit();
    }
  }

  private initializeClient() {
    const redisUrl = this.config.get<string>("REDIS_URL");
    const redisHost = this.config.get<string>("REDIS_HOST");
    const redisPort = this.config.get<number>("REDIS_PORT");

    // 1. Fail-Fast Validation
    if (!redisUrl && (!redisHost || !redisPort)) {
      this.logger.error(
        "❌ Redis configuration missing. Provide either REDIS_URL or REDIS_HOST & REDIS_PORT.",
      );
      throw new Error("Missing Redis configuration");
    }

    // 2. Initialize based on environment with Reconnection Strategy
    if (redisUrl) {
      this.logger.log("🚀 Connecting to Production Redis via URL");
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        retryStrategy: (times) => Math.min(times * 50, 2000), // Exponential backoff
      });
    } else {
      this.logger.log("🐳 Connecting to Local Redis (Docker/Localhost)");
      this.client = new Redis({
        host: redisHost,
        port: redisPort,
        maxRetriesPerRequest: 1,
        enableReadyCheck: true,
        retryStrategy: (times) => Math.min(times * 50, 2000), // Exponential backoff
      });
    }

    // 3. Attach Standard Event Listeners for Observability
    this.client.on("connect", () => {
      this.logger.log("✅ Redis Client connected to TCP socket");
    });

    this.client.on("ready", () => {
      this.logger.log("✅ Redis Client ready to receive commands");
    });

    this.client.on("error", (err) => {
      this.logger.error("❌ Redis Client Connection Error", err);
    });
  }

  getClient(): Redis {
    // 4. Strict Safety Check
    if (!this.client) {
      throw new Error("Redis client was called before initialization.");
    }
    return this.client;
  }
}
