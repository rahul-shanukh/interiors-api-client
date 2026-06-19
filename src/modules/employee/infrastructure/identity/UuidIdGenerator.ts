import { Injectable } from '@nestjs/common';
import type { IdGenerator } from '../../application/services/id-generator';
import { randomUUID } from 'crypto';

@Injectable()
export class UuidIdGenerator implements IdGenerator {
  generate(): string {
    return randomUUID();
  }
}
