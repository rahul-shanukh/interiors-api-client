import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash, createHmac } from "crypto";
import { ClientSession, Model } from "mongoose";
import { IdempotencyRecord } from "./idempotency.schema";

export interface IdempotencyContext {
  caller: string;
  operation: string;
  key: string;
  request: unknown;
}

@Injectable()
export class IdempotencyService {
  private readonly secret =
    process.env.IDEMPOTENCY_SECRET ||
    process.env.CUSTOMER_KEY_SECRET ||
    "default_secret";

  static readonly RETENTION_HOURS = parseInt(
    process.env.RETENTION_HOURS || "24",
    10,
  );

  constructor(
    @InjectModel(IdempotencyRecord.name)
    private readonly records: Model<IdempotencyRecord>,
  ) {}

  fingerprint(value: unknown): string {
    return createHash("sha256")
      .update(this.stableStringify(value))
      .digest("hex");
  }

  // Retrieves the saved result for the given idempotency context, if it exists and is completed.
  async getSavedResult<T>(context: IdempotencyContext): Promise<T | undefined> {
    const record = await this.records
      .findOne(this.identity(context))
      .lean()
      .exec();
    if (!record) return undefined;
    this.assertSamePayload(record.requestFingerprint, context.request);
    if (record.status !== "COMPLETED" || !record.result) {
      throw new ConflictException(
        "A request with this idempotency key is still processing.",
      );
    }
    return record.result as T;
  }

  // Retrieves the saved result for the given idempotency context, if it exists, regardless of its status.
  async getCompletedResult<T>(
    context: IdempotencyContext,
  ): Promise<T | undefined> {
    const record = await this.records
      .findOne(this.identity(context))
      .lean()
      .exec();
    if (!record) return undefined;
    this.assertSamePayload(record.requestFingerprint, context.request);
    return record.status === "COMPLETED"
      ? (record.result as T | undefined)
      : undefined;
  }

  async claim(
    context: IdempotencyContext,
    session: ClientSession,
  ): Promise<void> {
    try {
      await this.records.create(
        [
          {
            ...this.identity(context),
            requestFingerprint: this.fingerprint(context.request),
            status: "PROCESSING",
            expiresAt: new Date(
              Date.now() + IdempotencyService.RETENTION_HOURS * 60 * 60 * 1000,
            ),
          },
        ],
        { session },
      );
    } catch (error: any) {
      if (error?.code === 11000) {
        // A unique-key race aborts the losing transaction. The caller retries
        // once outside the transaction and then reads the committed result.
        throw new ConflictException(
          "A request with this idempotency key is already processing.",
        );
      }
      throw error;
    }
  }

  async saveResult(
    context: IdempotencyContext,
    result: Record<string, unknown>,
    session: ClientSession,
  ): Promise<void> {
    const updated = await this.records.updateOne(
      {
        ...this.identity(context),
        requestFingerprint: this.fingerprint(context.request),
      },
      { $set: { status: "COMPLETED", result } },
      { session },
    );
    if (updated.matchedCount !== 1) {
      throw new ServiceUnavailableException(
        "Could not save the idempotent result.",
      );
    }
  }

  private identity(context: IdempotencyContext) {
    return {
      scope: createHmac("sha256", this.secret)
        .update(context.caller.trim().toLowerCase())
        .digest("hex"),
      operation: context.operation,
      key: context.key,
    };
  }

  private assertSamePayload(
    existingFingerprint: string,
    request: unknown,
  ): void {
    if (existingFingerprint !== this.fingerprint(request)) {
      throw new ConflictException(
        "Idempotency-Key was already used with different request data.",
      );
    }
  }

  private stableStringify(value: unknown): string {
    if (Array.isArray(value))
      return `[${value.map((item) => this.stableStringify(item)).join(",")}]`;
    if (value && typeof value === "object") {
      const object = value as Record<string, unknown>;
      return `{${Object.keys(object)
        .sort()
        .map(
          (key) =>
            `${JSON.stringify(key)}:${this.stableStringify(object[key])}`,
        )
        .join(",")}}`;
    }
    return JSON.stringify(value) ?? "null";
  }
}
