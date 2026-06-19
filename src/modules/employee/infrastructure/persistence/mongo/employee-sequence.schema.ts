import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ collection: 'counters' })
export class EmployeeSequenceDocument {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  value: number;
}

export const EmployeeSequenceSchema = SchemaFactory.createForClass(
  EmployeeSequenceDocument,
);
