import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class RecaptchaService {
  private readonly secret: string;
  private readonly hostnames: Set<string>;
  private readonly minScore: number;

  constructor(config: ConfigService) {
    this.secret = config.get<string>("RECAPTCHA_SECRET_KEY")?.trim() ?? "";
    const hosts = config.get<string>("RECAPTCHA_ALLOWED_HOSTNAMES") ?? "";
    this.hostnames = new Set(
      hosts
        .split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean),
    );
    const score = String(
      config.get<string | number>("RECAPTCHA_MIN_SCORE") ?? "0.5",
    );
    this.minScore = Number(score);

    // Fail at startup when protection cannot be configured safely.
    if (!this.secret) throw new Error("RECAPTCHA_SECRET_KEY is required");
    if (
      !this.hostnames.size ||
      [...this.hostnames].some(
        (host) =>
          !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/.test(
            host,
          ),
      )
    ) {
      throw new Error(
        "RECAPTCHA_ALLOWED_HOSTNAMES must contain comma-separated hostnames without URLs, ports, or wildcards",
      );
    }
    if (
      !score.trim() ||
      !Number.isFinite(this.minScore) ||
      this.minScore < 0 ||
      this.minScore > 1
    ) {
      throw new Error("RECAPTCHA_MIN_SCORE must be a number between 0 and 1");
    }
  }

  async verify(token: string, expectedAction = "quote_submit"): Promise<void> {
    if (typeof token !== "string" || !token.trim()) {
      throw new ForbiddenException(
        "reCAPTCHA verification failed. Please try again.",
      );
    }
    if (!expectedAction.trim())
      throw new Error("Expected reCAPTCHA action is required");

    let result: unknown;
    try {
      // Keep credentials in the body; do not log tokens or retry single-use tokens.
      const response = await fetch(
        "https://www.google.com/recaptcha/api/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({ secret: this.secret, response: token }),
          signal: AbortSignal.timeout(5000),
          redirect: "error",
        },
      );
      if (!response.ok) throw new Error("Verification endpoint unavailable");
      result = await response.json();
    } catch {
      // An unavailable verifier must never allow the submission through.
      throw new ServiceUnavailableException(
        "reCAPTCHA verification is unavailable. Please try again later.",
      );
    }

    if (
      !result ||
      typeof result !== "object" ||
      !("success" in result) ||
      typeof result.success !== "boolean"
    ) {
      throw new ServiceUnavailableException(
        "reCAPTCHA verification is unavailable. Please try again later.",
      );
    }
    const data = result as Record<string, unknown>;
    const codes = data["error-codes"];
    if (
      Array.isArray(codes) &&
      codes.some(
        (code) =>
          code === "missing-input-secret" || code === "invalid-input-secret",
      )
    ) {
      throw new ServiceUnavailableException(
        "reCAPTCHA verification is unavailable. Please try again later.",
      );
    }

    // A valid token must also belong to our site and the server-selected action.
    if (
      data.success !== true ||
      data.action !== expectedAction ||
      typeof data.hostname !== "string" ||
      !this.hostnames.has(data.hostname.toLowerCase()) ||
      typeof data.score !== "number" ||
      !Number.isFinite(data.score) ||
      data.score < this.minScore ||
      data.score > 1
    ) {
      throw new ForbiddenException(
        "reCAPTCHA verification failed. Please try again.",
      );
    }
  }
}
