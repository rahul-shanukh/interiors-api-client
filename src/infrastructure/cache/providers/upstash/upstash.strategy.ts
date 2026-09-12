import { Injectable } from "@nestjs/common";
import { Ratelimit } from "@upstash/ratelimit";
import { ICacheStrategy } from "src/shared/cache/cache-strategy.interface";
import { UpstashService } from "./upstash.service";

@Injectable()
export class UpstashStrategy implements ICacheStrategy {
  private readonly rateLimiters = new Map<string, Ratelimit>();

  constructor(private readonly upstashService: UpstashService) {}

  async get<T>(key: string): Promise<T | null> {
    return this.upstashService.getClient().get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    nx?: boolean,
  ): Promise<boolean> {
    const client = this.upstashService.getClient();

    let result: any;

    if (ttl && nx) {
      result = await client.set(key, value, { ex: ttl, nx: true });
    } else if (ttl) {
      result = await client.set(key, value, { ex: ttl });
    } else if (nx) {
      result = await client.set(key, value, { nx: true });
    } else {
      result = await client.set(key, value);
    }

    return result === "OK";
  }

  async delete(key: string): Promise<void> {
    await this.upstashService.getClient().del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.upstashService.getClient().exists(key);
    return result === 1;
  }

  async clear(pattern: string = "*"): Promise<void> {
    const client = this.upstashService.getClient();

    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    const client = this.upstashService.getClient();

    const count = await client.incr(key);

    if (count === 1 && ttl) {
      await client.expire(key, ttl);
    }

    return count;
  }

  async slidingWindowRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const limiterKey = `${limit}:${windowSeconds}`;

    let ratelimit = this.rateLimiters.get(limiterKey);

    if (!ratelimit) {
      ratelimit = new Ratelimit({
        redis: this.upstashService.getClient(),
        limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
        prefix: "notification-rate-limit",
      });

      this.rateLimiters.set(limiterKey, ratelimit);
    }

    const result = await ratelimit.limit(key);

    return result.success;
  }

  async tokenBucketRateLimit(
    key: string,
    refillRate: number,
    intervalSeconds: number,
    maxTokens: number,
  ): Promise<boolean> {
    const limiterKey = `tokenBucket:${refillRate}:${intervalSeconds}:${maxTokens}`;

    let ratelimit = this.rateLimiters.get(limiterKey);

    if (!ratelimit) {
      ratelimit = new Ratelimit({
        redis: this.upstashService.getClient(),
        limiter: Ratelimit.tokenBucket(
          refillRate,
          `${intervalSeconds} s`,
          maxTokens,
        ),
        prefix: "quote-rate-limit",
      });

      this.rateLimiters.set(limiterKey, ratelimit);
    }

    const result = await ratelimit.limit(key);

    return result.success;
  }
}
