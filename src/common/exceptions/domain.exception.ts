// Business rule failure Maps to: 400

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class DomainException extends BaseException {
  constructor(message: string, errorCode: string, traceId?: string) {
    super(message, errorCode, HttpStatus.BAD_REQUEST, traceId);
  }
}
