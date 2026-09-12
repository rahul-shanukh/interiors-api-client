// src/health/health.controller.ts
import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ServiceUnavailableException,
} from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from "@nestjs/terminus";
import { ReadinessService } from "./readiness.service";
import { Public } from "../common/decorators/roles.decorator";
import { CircuitBreakerFactory } from "src/infrastructure/resilience/circuit-breaker.factory";

@Public()
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
    private readonly readiness: ReadinessService,
    private readonly circuitBreakerFactory: CircuitBreakerFactory,
  ) {}

  // ✅ LIVENESS — container/process alive
  @Get("live")
  liveness() {
    return {
      status: "UP",
      service: "employee-backend",
      timestamp: new Date().toISOString(),
    };
  }

  // ✅ READINESS — traffic allowed?
  @Get("ready")
  async readinessCheck() {
    const result = await this.readiness.isReady();

    if (result.status === "DOWN" || result.mongodb === "DOWN") {
      throw new ServiceUnavailableException(result);
    }

    return result;
  }

  // ✅ DIAGNOSTICS — deep dependency check
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.mongoose.pingCheck("mongodb")]);
  }

  @Get("circuit-breakers/:name")
  getCircuitBreakerHealth(@Param("name") name: string) {
    const breaker = this.circuitBreakerFactory.findBreaker(name);

    if (!breaker) {
      throw new NotFoundException(
        `Circuit breaker '${name}' is not registered`,
      );
    }

    return {
      name,
      circuitState: breaker.opened
        ? "OPEN"
        : breaker.halfOpen
          ? "HALF_OPEN"
          : "CLOSED",
      healthy: !breaker.opened,
      stats: (breaker.stats as any).toJSON(),
    };
  }

  @Get("circuit-breakers")
  getCircuitBreakers() {
    return {
      circuitBreakers: this.circuitBreakerFactory.getAllStats(),
    };
  }
}
