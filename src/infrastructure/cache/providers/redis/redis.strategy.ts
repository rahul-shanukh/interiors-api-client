// Backend\interiors-api-client\src\infrastructure\cache\providers\redis\redis.strategy.ts

import { Injectable } from "@nestjs/common";
import { ICacheStrategy } from "src/shared/cache/cache-strategy.interface";
import { RedisService } from "./redis.service";

@Injectable()
export class RedisStrategy implements ICacheStrategy {
  // ✅ DO: Just inject the service here.
  // ❌ DON'T: Call this.redisService.getClient() inside this constructor!
  constructor(private readonly redisService: RedisService) {}

  async get<T>(key: string): Promise<T | null> {
    // Call getClient() exactly when you need it
    const data = await this.redisService.getClient().get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as any as T;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    nx?: boolean,
  ): Promise<boolean> {
    const client = this.redisService.getClient();
    const stringValue =
      typeof value === "object" ? JSON.stringify(value) : String(value);

    let result: any;

    // Abstracting the raw ioredis syntax inside the strategy
    if (ttl && nx) {
      result = await client.set(key, stringValue, "EX", ttl, "NX");
    } else if (ttl) {
      result = await client.set(key, stringValue, "EX", ttl);
    } else if (nx) {
      result = await client.set(key, stringValue, "NX");
    } else {
      result = await client.set(key, stringValue);
    }

    // Redis returns "OK" if set, null if NX blocked it
    return result === "OK";
  }

  async delete(key: string): Promise<void> {
    await this.redisService.getClient().del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisService.getClient().exists(key);
    return result > 0;
  }

  async clear(pattern: string = "*"): Promise<void> {
    const client = this.redisService.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  async increment(key: string, ttl?: number): Promise<number> {
    const client = this.redisService.getClient();

    const count = await client.incr(key);

    if (count === 1 && ttl) {
      client.expire(key, ttl);
    }

    return count;
  }
}
