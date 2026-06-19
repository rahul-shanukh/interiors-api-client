import { Injectable } from '@nestjs/common';
import { EmployeeId } from '../../domain/value-objects/employee-id.vo';
import { EmployeeSequenceRepository } from '../persistence/mongo/employee-sequence.repository';

@Injectable()
export class EmployeeIdGenerator {
  constructor(private readonly sequenceRepo: EmployeeSequenceRepository) {}

  // Add logging to see what's happening
  async generate(countryCode: string): Promise<EmployeeId> {
    try {
      console.log('🔍 Generating employee ID for country:', countryCode);
      console.log('🔍 sequenceRepo:', this.sequenceRepo);

      const sequence = await this.sequenceRepo.next();
      console.log('✅ Got sequence:', sequence);

      const code = `EMP-${countryCode}-SE-${String(sequence).padStart(6, '0')}`;
      console.log('✅ Generated code:', code);

      return EmployeeId.create(code);
    } catch (error) {
      console.error('❌ ERROR in employee-id.generator:', error);
      throw error;
    }
  }
}
