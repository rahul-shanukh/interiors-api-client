// src/infrastructure/resilience/resilience.module.ts

import { Module, Global } from "@nestjs/common";
import { CircuitBreakerFactory } from "./circuit-breaker.factory";

@Global()
@Module({
  providers: [CircuitBreakerFactory],
  exports: [CircuitBreakerFactory],
})
export class ResilienceModule {}
