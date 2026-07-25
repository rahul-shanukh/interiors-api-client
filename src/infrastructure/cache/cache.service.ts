// Backend\interiors-api-client\src\infrastructure\cache\cache.service.ts

import { Injectable } from "@nestjs/common"; // <-- Added this
import { ICacheStrategy } from "src/shared/cache/cache-strategy.interface";
import { CacheFactory } from "./factory/cache.factory";

@Injectable()
export class CacheService {
  private readonly strategy: ICacheStrategy;

  public constructor(private readonly cacheFactory: CacheFactory) {
    this.strategy = this.cacheFactory.getStrategy();
  }

  async get<T>(key: string): Promise<T | null> {
    return this.strategy.get<T>(key);
  }

  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    nx?: boolean,
  ): Promise<boolean> {
    return this.strategy.set<T>(key, value, ttl, nx);
  }

  async delete(key: string): Promise<void> {
    return this.strategy.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.strategy.exists(key);
  }

  async clear(pattern?: string): Promise<void> {
    return this.strategy.clear(pattern);
  }

  increment(key: string, ttl?: number): Promise<number> {
    return this.strategy.increment(key, ttl);
  }
}
