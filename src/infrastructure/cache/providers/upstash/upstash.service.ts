import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Redis } from "@upstash/redis";
import { Agent } from "https";

@Injectable()
export class UpstashService implements OnModuleInit {
  private readonly logger = new Logger(UpstashService.name);

  // Singleton Upstash client instance
  private client!: Redis;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const activeProvider = this.config
      .get<string>("CACHE_PROVIDER")
      ?.toLowerCase();

    if (activeProvider !== "upstash") {
      this.logger.log(
        "⏸️ Upstash is not the active cache provider. Skipping initialization.",
      );
      return; // EXIT EARLY!
    }
    this.initializeClient();
  }

  private initializeClient() {
    const url = this.config.get<string>("UPSTASH_REDIS_REST_URL");
    const token = this.config.get<string>("UPSTASH_REDIS_REST_TOKEN");

    // 1. Fail-Fast Validation: Do not silently fail or lazy-load bad configs
    if (!url || !token) {
      this.logger.error(
        "❌ Upstash credentials missing. Check environment variables.",
      );
      throw new Error(
        "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN",
      );
    }

    this.logger.log("🚀 Initializing Upstash REST Client");

    // 2. Scalability Optimization: HTTP Keep-Alive
    // Bypasses the costly TLS handshake on every request by reusing the connection socket
    const keepAliveAgent = new Agent({
      keepAlive: true,
      maxSockets: 100, // Handle high concurrency seamlessly
    });

    try {
      this.client = new Redis({
        url,
        token,
        agent: keepAliveAgent,
      });

      this.logger.log(
        "✅ Upstash Client successfully initialized with Keep-Alive",
      );
    } catch (error) {
      this.logger.error("❌ Failed to initialize Upstash Client", error);
      throw error;
    }
  }

  getClient(): Redis {
    // 3. Strict Safety Check: Ensure the client is never used uninitialized
    if (!this.client) {
      throw new Error("Upstash client was called before initialization.");
    }
    return this.client;
  }
}
