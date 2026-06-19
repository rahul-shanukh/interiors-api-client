// src/health/health.controller.ts
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { ReadinessService } from './readiness.service';

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly readiness: ReadinessService,
  ) {}

  // ✅ LIVENESS — container/process alive
  @Get('live')
  liveness() {
    return {
      status: 'UP',
      service: 'employee-backend',
      timestamp: new Date().toISOString(),
    };
  }

  // ✅ READINESS — traffic allowed?
  @Get('ready')
  async readinessCheck() {
    const result = await this.readiness.isReady();

    if (result.status === 'DOWN' || result.mongodb === 'DOWN') {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }

  // ✅ DIAGNOSTICS — deep dependency check
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.mongoose.pingCheck('mongodb')]);
  }
}
