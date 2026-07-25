import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisStrategy } from "../providers/redis/redis.strategy";
import { UpstashStrategy } from "../providers/upstash/upstash.strategy";
import { ICacheStrategy } from "src/shared/cache/cache-strategy.interface";
import { CacheProvider } from "../types/cache.types";

@Injectable()
export class CacheFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly redisStrategy: RedisStrategy,
    private readonly upstashStrategy: UpstashStrategy,
  ) {}

  getStrategy(): ICacheStrategy {
    const provider = this.configService
      .getOrThrow<string>("CACHE_PROVIDER")
      .toLowerCase() as CacheProvider;

    switch (provider) {
      case "upstash":
        return this.upstashStrategy;

      case "redis":
        return this.redisStrategy;

      default:
        throw new Error(`Unsupported cache provider: ${provider}`);
    }
  }
}
