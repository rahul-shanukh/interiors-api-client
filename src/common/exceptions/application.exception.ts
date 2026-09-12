// Workflow or orchestration failure Maps to: 422

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

export class ApplicationException extends BaseException {
  constructor(message: string, errorCode: string, traceId?: string) {
    super(message, errorCode, HttpStatus.UNPROCESSABLE_ENTITY, traceId);
  }
}
