//Backend\interiors-api-client\src\infrastructure\cache\cache.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RedisService } from "./providers/redis/redis.service";
import { UpstashService } from "./providers/upstash/upstash.service";
import { RedisStrategy } from "./providers/redis/redis.strategy";
import { UpstashStrategy } from "./providers/upstash/upstash.strategy";
import { CacheFactory } from "./factory/cache.factory";
import { CacheService } from "./cache.service";

@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    UpstashService,
    RedisStrategy,
    UpstashStrategy,
    CacheFactory,
    CacheService,
  ],
  exports: [CacheService],
})
export class CacheModule {}
