import { HttpException, HttpStatus } from '@nestjs/common';
/**
 * BaseException acts as the structural contract (Template) for all custom errors.
 * It enforces that every exception must have a message, an errorCode, and a statusCode.
 */
export abstract class BaseException extends HttpException {
  public readonly errorCode: string;
  public readonly traceId?: string;

  constructor(
    message: string,
    errorCode: string,
    statusCode: HttpStatus | number,
    traceId?: string,
  ) {
    // Pass the message and HTTP status to the underlying NestJS HttpException
    super(message, statusCode);
    // Attach the custom module-specific error code (e.g., MODULE_XXX)
    this.errorCode = errorCode;
    this.traceId = traceId;
  }
}
