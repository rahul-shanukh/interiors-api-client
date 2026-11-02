// src/infrastructure/resilience/circuit-breaker.factory.ts

import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { NotFoundException } from "@nestjs/common";
import CircuitBreaker from "opossum";

export interface CircuitBreakerOptions {
  timeout?: number; // Time in ms before considering operation as failed (default: 3000)
  errorThresholdPercentage?: number; // Error percentage to open circuit (default: 50)
  resetTimeout?: number; // Time in ms before attempting to close circuit (default: 30000)
  rollingCountTimeout?: number; // Time window for error percentage (default: 10000)
  rollingCountBuckets?: number; // Number of buckets in rolling window (default: 10)
  capacity?: number; // Semaphore capacity (default: unlimited)
  volumeThreshold?: number; // Minimum requests before circuit can open (default: 0)
  errorFilter?: (error: any) => boolean; // Function to filter errors
}

/**
 * Factory for creating and managing multiple Opossum circuit breakers
 * Ensures single instance per service name (singleton per name)
 *
 * @example
 * ```typescript
 * const breaker = factory.getOrCreateBreaker('RedisCache', {
 *   timeout: 3000,
 *   errorThresholdPercentage: 50,
 *   resetTimeout: 30000
 * });
 *
 * const result = await breaker.fire(async () => {
 *   return await redisClient.get('key');
 * });
 * ```
 */
@Injectable()
export class CircuitBreakerFactory implements OnApplicationShutdown {
  onApplicationShutdown(signal?: string) {
    this.breakers.forEach((breaker, name) => {
      breaker.shutdown();
      this.logger.log({
        event: "circuit_shutdown",
        service: name,
        message: `Circuit breaker shutdown for ${name} due to signal: ${signal}`,
      });
    });
  }
  private readonly logger = new Logger(CircuitBreakerFactory.name);
  private readonly breakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a specific service
   */
  getOrCreateBreaker<T = any, R = any>(
    name: string,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker<T[], R> {
    if (!this.breakers.has(name)) {
      const breaker = this.createBreaker<T, R>(name, options);
      this.breakers.set(name, breaker);
    }
    return this.breakers.get(name)! as CircuitBreaker<T[], R>;
  }

  /**
   * Find an already-registered breaker without creating one.
   */
  findBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Create a new circuit breaker with logging
   */
  private createBreaker<T, R>(
    name: string,
    options?: CircuitBreakerOptions,
  ): CircuitBreaker<T[], R> {
    // Opossum passes fire() arguments to this action.
    const action = async (...args: T[]): Promise<R> => {
      const operation = args[0] as unknown as () => Promise<R>;
      return operation();
    };
    // what is the action for:
    // it wraps the actual operation passed to fire() and ensures it returns a Promise<R>
    const breaker = new CircuitBreaker<T[], R>(action, {
      timeout: options?.timeout ?? 3000,
      errorThresholdPercentage: options?.errorThresholdPercentage ?? 50,
      resetTimeout: options?.resetTimeout ?? 30000,
      rollingCountTimeout: options?.rollingCountTimeout ?? 10000,
      rollingCountBuckets: options?.rollingCountBuckets ?? 10,
      capacity: options?.capacity,
      volumeThreshold: options?.volumeThreshold ?? 2,
      errorFilter: options?.errorFilter,
      name,
    });

    // Attach event listeners for observability
    this.attachEventListeners(breaker, name);

    return breaker;
  }

  /**
   * Attach event listeners for logging and monitoring
   */
  private attachEventListeners(breaker: CircuitBreaker, name: string): void {
    breaker.on("open", () => {
      this.logger.error({
        event: "circuit_opened",
        service: name,
        message: `Circuit breaker opened for ${name}`,
      });
    });

    breaker.on("halfOpen", () => {
      this.logger.log({
        event: "circuit_half_open",
        service: name,
        message: `Circuit breaker testing recovery for ${name}`,
      });
    });

    breaker.on("close", () => {
      this.logger.log({
        event: "circuit_closed",
        service: name,
        message: `Circuit breaker closed for ${name}`,
      });
    });

    breaker.on("success", () => {
      this.logger.debug({
        event: "circuit_success",
        service: name,
      });
    });

    breaker.on("failure", (error: Error) => {
      this.logger.warn({
        event: "circuit_failure",
        service: name,
        error: error.message,
      });
    });

    breaker.on("timeout", () => {
      this.logger.warn({
        event: "circuit_timeout",
        service: name,
        message: `Operation timed out for ${name}`,
      });
    });

    breaker.on("reject", () => {
      this.logger.warn({
        event: "circuit_rejected",
        service: name,
        message: `Request rejected by circuit breaker for ${name}`,
      });
    });

    breaker.on("fallback", () => {
      this.logger.log({
        event: "circuit_fallback",
        service: name,
        message: `Fallback executed for ${name}`,
      });
    });
  }

  /**
   * Get all circuit breaker statistics (useful for health checks)
   */
  getAllStats() {
    return Array.from(this.breakers.entries()).map(([name, breaker]) => ({
      name,
      state: breaker.opened
        ? "OPEN"
        : breaker.halfOpen
          ? "HALF_OPEN"
          : "CLOSED",
      stats: (breaker.stats as any).toJSON(),
    }));
  }

  /**
   * Get specific breaker stats
   */
  getStats(name: string) {
    const breaker = this.breakers.get(name);
    if (!breaker)
      throw new NotFoundException(
        `Circuit breaker '${name}' is not registered`,
      );

    return {
      name,
      state: breaker.opened
        ? "OPEN"
        : breaker.halfOpen
          ? "HALF_OPEN"
          : "CLOSED",
      stats: (breaker.stats as any).toJSON(),
    };
  }

  /**
   * Reset all circuit breakers to closed state
   */
  resetAll(): void {
    this.breakers.forEach((breaker, name) => {
      breaker.close();
      this.logger.log({
        event: "circuit_reset",
        service: name,
        message: `Circuit breaker reset for ${name}`,
      });
    });
  }

  /**
   * Reset specific circuit breaker
   */
  reset(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (!breaker) return false;

    breaker.close();
    this.logger.log({
      event: "circuit_reset",
      service: name,
      message: `Circuit breaker reset for ${name}`,
    });
    return true;
  }

  /**
   * Remove a circuit breaker
   */
  remove(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (!breaker) return false;

    breaker.shutdown();
    this.breakers.delete(name);
    this.logger.log({
      event: "circuit_removed",
      service: name,
    });
    return true;
  }

  /**
   * Shutdown all circuit breakers
   */
  shutdownAll(): void {
    this.breakers.forEach((breaker, name) => {
      breaker.shutdown();
      this.logger.log({
        event: "circuit_shutdown",
        service: name,
      });
    });
    this.breakers.clear();
  }
}
