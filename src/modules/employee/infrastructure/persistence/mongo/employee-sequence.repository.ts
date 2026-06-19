import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmployeeSequenceDocument } from './employee-sequence.schema';

export class EmployeeSequenceRepository {
  constructor(
    @InjectModel(EmployeeSequenceDocument.name)
    private readonly model: Model<EmployeeSequenceDocument>,
  ) {
    console.log('✅ EmployeeSequenceRepository initialized');
  }

  async next(): Promise<number> {
    try {
      console.log('🔍 Attempting to get next sequence number...');

      const seq = await this.model.findOneAndUpdate(
        { name: 'employee' },
        { $inc: { value: 1 } },
        { new: true, upsert: true },
      );

      console.log('✅ Sequence retrieved:', seq);
      console.log('✅ Next value:', seq.value);

      return seq.value;
    } catch (error) {
      console.error('❌ ERROR in EmployeeSequenceRepository.next():', error);
      throw error;
    }
  }
}
