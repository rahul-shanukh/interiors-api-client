import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { NormalizedQuoteData } from "../types/normalized_quote_data.types";
import { CacheService } from "src/infrastructure/cache/cache.service";
import { CACHE_KEYS } from "src/infrastructure/cache/config/cache.constants";

// why this class is needed
// : to prevent duplicate quote submissions,
// we need to generate a unique fingerprint for each quote submission based on the normalized data.
// This fingerprint is then used to check if a similar submission has already been made within a certain time frame (e.g., 5 minutes).
// If a duplicate submission is detected, the service will return true, indicating that the submission should be rejected.

@Injectable()
export class QuoteSubmissionGuardService {
  constructor(
    private readonly cacheService: CacheService,
    private readonly config: ConfigService,
  ) {}

  private generateFingerprint(data: NormalizedQuoteData): string {
    let canonical = [
      data.calculatorType,
      data.bhkType,
      data.builtupArea,
      data.package,
      data.email,
      data.phone,
      data.location.city,
      data.location.state,
      data.location.country,
      data.rooms.living ?? 0,
      data.rooms.kitchen ?? 0,
      data.rooms.bedroom ?? 0,
      data.rooms.bathroom ?? 0,
      data.rooms.dining ?? 0,
    ].join("|");

    switch (data.calculatorType) {
      case "full_home":
        canonical += `|${this.config.get("FULL_HOME_PRICING_VERSION")}`;
        break;
      case "kitchen":
        canonical += `|${this.config.get("KITCHEN_PRICING_VERSION")}`;
        break;
      case "wardrobe":
        canonical += `|${this.config.get("WARDROBE_PRICING_VERSION")}`;
        break;
      default:
        canonical += `|default_v1`;
        break;
    }

    return createHash("sha256").update(canonical).digest("hex");
  }

  private createLockKey(fingerprint: string): string {
    return `${CACHE_KEYS.QUOTE_SUBMISSION_LOCK}:${fingerprint}`;
  }

  public async isDuplicateSubmission(
    dto: NormalizedQuoteData,
  ): Promise<{ fingerprint: string; isDuplicate: boolean }> {
    // Generate fingerprint synchronously
    const fingerprint = this.generateFingerprint(dto);
    const lockKey = this.createLockKey(fingerprint);

    // Acquire lock in Redis (NX = true ensures it only sets if it doesn't exist)
    const lockAcquired = await this.cacheService.set(
      lockKey,
      "locked",
      300,
      true, // true = NX (Not Exists) flag
    );

    return { fingerprint, isDuplicate: !lockAcquired };
  }

  public async releaseLock(fingerprint: string): Promise<void> {
    const lockKey = this.createLockKey(fingerprint);
    await this.cacheService.delete(lockKey);
  }
}
