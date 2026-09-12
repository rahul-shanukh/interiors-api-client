// External/system failure Maps to: 500

import { HttpStatus } from "@nestjs/common";
import { BaseException } from "./base.exception";

export class InfrastructureException extends BaseException {
  constructor(
    message: string,
    errorCode: string,
    status: HttpStatus | number = HttpStatus.INTERNAL_SERVER_ERROR,
    traceId?: string,
  ) {
    super(message, errorCode, status, traceId);
  }
}
export class RateLimitException extends InfrastructureException {
  constructor(
    message: string = "Rate limit exceeded. Please try again later.",
    errorCode: string = "RATE_LIMIT_EXCEEDED",
    traceId?: string,
  ) {
    super(message, errorCode, HttpStatus.TOO_MANY_REQUESTS, traceId);
  }
}
