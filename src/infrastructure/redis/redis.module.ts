//backend\src\infrastructure\redis\redis.module.ts

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (redisService: RedisService) => {
        return redisService.getClient();
      },
      inject: [RedisService],
    },
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
