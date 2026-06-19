// src/health/health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ReadinessService } from './readiness.service';

@Module({
  imports: [TerminusModule, MongooseModule],
  controllers: [HealthController],
  providers: [ReadinessService],
})
export class HealthModule {}
