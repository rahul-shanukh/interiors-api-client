import { ServiceUnavailableException } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac } from "crypto";
import CircuitBreaker from "opossum";
import { CacheService } from "../cache.service";
import { CACHE_KEYS } from "../config/cache.constants";
import { RATE_LIMIT_CONFIG } from "../config/cache.config";
import { RateLimitException } from "src/common/exceptions/infrastructure.exception";
import { CircuitBreakerFactory } from "src/infrastructure/resilience/circuit-breaker.factory";

interface QuoteRequestDto {
  email: string;
  phone: string;
}

/**
 * Phase 3.1 Defense-in-Depth Rate Limiting for Quote Requests
 *
 * Four independent identity checks:
 * 1. IP-based (Token Bucket) - Allows legitimate bursts, handles NAT/shared IPs gracefully
 * 2. Email-based (Sliding Window) - Strict quota enforcement, prevents boundary exploits
 * 3. Phone-based (Sliding Window) - Strict quota enforcement, prevents boundary exploits
 * 4. Global system ceiling (Token Bucket) - Handles traffic spikes with controlled bursts
 *
 * Uses Upstash rate limiting algorithms - production-tested and boundary-exploit-free.
 * All PII (email, phone) is HMAC-SHA256 hashed before storage.
 *
 * Circuit Breaker Protection:
 * - Protects against Redis cascading failures
 * - Configurable fail-open or fail-closed policy
 */
@Injectable()
export class QuoteRequestRateLimiter {
  private readonly logger = new Logger(QuoteRequestRateLimiter.name);
  private readonly hmacSecret: string;
  private readonly circuitBreaker: CircuitBreaker;

  // Policy: fail open or fail closed when circuit is open
  private readonly failOpen = false; // Set false to block requests when Redis is down

  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly circuitBreakerFactory: CircuitBreakerFactory,
  ) {
    // Initialize HMAC secret for hashing PII(Personal Identifiable Information) before storing in cache
    this.hmacSecret = this.configService.getOrThrow<string>(
      "RATE_LIMIT_HMAC_SECRET",
    );

    // Get circuit breaker for Redis rate limiting with opossum
    this.circuitBreaker = this.circuitBreakerFactory.getOrCreateBreaker(
      "RateLimitRedis",
      {
        timeout: 3000, // Redis operation timeout
        errorThresholdPercentage: 50, // Open after 50% errors
        resetTimeout: 30000, // Try recovery after 30s
        rollingCountTimeout: 10000, // 10s rolling window
        volumeThreshold: 5, // Min requests before circuit can open
      },
    );
  }

  /**
   * Main entry point: checks all 4 rate limit layers
   * Throws RateLimitException if any limit is exceeded
   */
  async check(dto: QuoteRequestDto, clientIp: string): Promise<void> {
    // Run all 4 independent limits concurrently for minimum latency
    await Promise.all([
      this.checkIpLimit(clientIp),
      this.checkEmailLimit(dto.email),
      this.checkPhoneLimit(dto.phone),
      this.checkGlobalLimit(),
    ]);

    this.logger.log({
      event: "rate_limit_passed",
      ip: clientIp,
      email: this.maskEmail(dto.email),
    });
  }

  private async checkIpLimit(clientIp: string): Promise<void> {
    const config = RATE_LIMIT_CONFIG.quote.ip;
    const key = `${CACHE_KEYS.RATE_LIMIT_IP}:${clientIp}`;

    // 1. Only wrap the actual Redis call in the circuit breaker
    const allowed = await this.executeWithCircuitBreaker("ip", async () => {
      return this.cacheService.tokenBucketRateLimit(
        key,
        config.maxRequests, // Refill rate
        config.windowSeconds, // Interval
        config.maxRequests * 2, // Max burst capacity (e.g., 2x refill rate)
      );
    });

    // 2. Handle the business logic outside the breaker
    if (!allowed) {
      this.logger.warn({
        event: "rate_limit_exceeded",
        layer: "ip",
        algorithm: "token_bucket",
        ip: clientIp,
      });

      throw new RateLimitException(
        `Too many quote requests from this IP. Please try again in ${Math.ceil(config.windowSeconds / 60)} minutes.`,
        "RATE_LIMIT_IP_EXCEEDED",
      );
    }
  }

  private async checkEmailLimit(email: string): Promise<void> {
    const config = RATE_LIMIT_CONFIG.quote.email;
    const normalizedEmail = this.normalizeEmail(email);
    const emailHash = this.createHmac(normalizedEmail);
    const key = `${CACHE_KEYS.RATE_LIMIT_EMAIL}:${emailHash}`;

    const allowed = await this.executeWithCircuitBreaker("email", async () => {
      return this.cacheService.slidingWindowRateLimit(
        key,
        config.maxRequests,
        config.windowSeconds,
      );
    });

    if (!allowed) {
      this.logger.warn({
        event: "rate_limit_exceeded",
        layer: "email",
        algorithm: "sliding_window",
        email: this.maskEmail(email),
      });

      throw new RateLimitException(
        `Too many quote requests for this email. Please try again in ${Math.ceil(config.windowSeconds / 3600)} hour(s).`,
        "RATE_LIMIT_EMAIL_EXCEEDED",
      );
    }
  }

  private async checkPhoneLimit(phone: string): Promise<void> {
    const config = RATE_LIMIT_CONFIG.quote.phone;
    const normalizedPhone = this.normalizePhone(phone);
    const phoneHash = this.createHmac(normalizedPhone);
    const key = `${CACHE_KEYS.RATE_LIMIT_PHONE}:${phoneHash}`;

    const allowed = await this.executeWithCircuitBreaker("phone", async () => {
      return this.cacheService.slidingWindowRateLimit(
        key,
        config.maxRequests,
        config.windowSeconds,
      );
    });

    if (!allowed) {
      this.logger.warn({
        event: "rate_limit_exceeded",
        layer: "phone",
        algorithm: "sliding_window",
        phone: `***${phone.slice(-4)}`,
      });

      throw new RateLimitException(
        `Too many quote requests for this phone number. Please try again in ${Math.ceil(config.windowSeconds / 3600)} hour(s).`,
        "RATE_LIMIT_PHONE_EXCEEDED",
      );
    }
  }

  private async checkGlobalLimit(): Promise<void> {
    const config = RATE_LIMIT_CONFIG.quote.global;
    const key = CACHE_KEYS.RATE_LIMIT_GLOBAL;

    const allowed = await this.executeWithCircuitBreaker("global", async () => {
      return this.cacheService.tokenBucketRateLimit(
        key,
        config.maxRequests,
        config.windowSeconds,
        config.maxRequests * 2,
      );
    });

    if (!allowed) {
      this.logger.error({
        event: "rate_limit_exceeded",
        layer: "global",
        algorithm: "token_bucket",
        message: "System-wide quote rate limit exceeded",
      });

      throw new RateLimitException(
        "The quote system is experiencing high load. Please try again shortly.",
        "RATE_LIMIT_GLOBAL_EXCEEDED",
      );
    }
  }

  /**
   * Execute operation with circuit breaker protection
   * Uses opossum's fire() method with automatic failure detection
   */
  private async executeWithCircuitBreaker(
    layer: string,
    operation: () => Promise<boolean>,
  ): Promise<boolean> {
    try {
      return (await this.circuitBreaker.fire(operation, layer)) as boolean;
    } catch (error) {
      // Circuit breaker will automatically track failures
      // RateLimitException will be thrown through
      if (
        error instanceof RateLimitException ||
        error instanceof ServiceUnavailableException
      ) {
        throw error;
      }

      // Log infrastructure errors
      this.logger.error({
        event: "rate_limit_check_failed",
        layer,
        error: error instanceof Error ? error.message : String(error),
        circuitState: this.circuitBreaker.opened
          ? "OPEN"
          : this.circuitBreaker.halfOpen
            ? "HALF_OPEN"
            : "CLOSED",
      });

      // Apply the rate limiter's fail-open/fail-closed policy for
      // infrastructure failures and an already-open circuit.
      this.handleCircuitOpen(layer);
      return true;
    }
  }

  /**
   * Handle when circuit is open (Redis unavailable)
   * Called for infrastructure failures and an already-open circuit
   */
  private handleCircuitOpen(layer: string): void {
    this.logger.warn({
      event: "circuit_breaker_open",
      layer,
      circuitState: this.circuitBreaker.opened
        ? "OPEN"
        : this.circuitBreaker.halfOpen
          ? "HALF_OPEN"
          : "CLOSED",
      policy: this.failOpen ? "fail_open" : "fail_closed",
      message: "Skipping Redis rate limit check due to circuit breaker",
    });

    if (!this.failOpen) {
      // Fail closed: block request when Redis is down
      this.logger.error({
        event: "service_unavailable_exception",
        layer,
        message: "Rate limiting service temporarily unavailable",
      });
      throw new ServiceUnavailableException(
        "Rate limiting service temporarily unavailable. Please try again later.",
      );
    }

    // Fail open: allow request to proceed (do nothing)
  }

  private createHmac(value: string): string {
    return createHmac("sha256", this.hmacSecret).update(value).digest("hex");
  }

  private normalizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  private maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    if (!domain) return "***";

    const visibleChars = Math.min(2, local.length);
    const masked = local.slice(0, visibleChars) + "***";
    return `${masked}@${domain}`;
  }
}
