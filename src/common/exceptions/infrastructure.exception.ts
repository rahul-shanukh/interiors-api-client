// External/system failure Maps to: 500

import { HttpStatus } from '@nestjs/common';
import { BaseException } from './base.exception';

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
