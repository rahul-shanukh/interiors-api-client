import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { IEmployeeRepository } from '../../../domain/repositories/employee.repository.interface';
import { Employee as EmployeeEntity } from '../../../domain/entities/employee.entity';
import { EmployeeId } from '../../../domain/value-objects/employee-id.vo';
import { EmployeeMapper } from '../../mappers/employee.mapper';
import {
  EmployeeDocument,
  Employee as EmployeeSchemaClass,
} from './employee.schema';

@Injectable()
export class EmployeeMongoRepository implements IEmployeeRepository {
  constructor(
    @InjectModel(EmployeeSchemaClass.name)
    private readonly employeeModel: Model<EmployeeDocument>,
  ) {}
  findAll(): Promise<EmployeeEntity[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * Saves a pure Domain Entity to MongoDB.
   * Handles both Creating (Insert) and Updating (Upsert).
   */
  async save(employee: EmployeeEntity): Promise<void> {
    // 1. Convert the pure Domain Entity into a flat JSON object for Mongoose
    const persistenceModel = EmployeeMapper.toPersistence(employee);

    // 2. Save to DB. Using `findOneAndUpdate` with `upsert: true` means:
    // "If an employee with this emp_id exists, update them. If not, create a new row."
    await this.employeeModel
      .findOneAndUpdate(
        { 'identity.emp_id': employee.id.value },
        { $set: persistenceModel },
        { upsert: true, new: true },
      )
      .exec();
  }

  /**
   * Fetches an Employee by their EmployeeId Value Object
   */
  async findById(id: EmployeeId): Promise<EmployeeEntity | null> {
    const doc = await this.employeeModel
      .findOne({ 'identity.emp_id': id.value })
      .exec();

    if (!doc) {
      return null; // Employee not found
    }

    // Convert the Mongoose document back into a pure Domain Entity
    return EmployeeMapper.toDomain(doc);
  }

  /**
   * Fetches an Employee by their Email string
   */
  async findByEmail(email: string): Promise<EmployeeEntity | null> {
    const doc = await this.employeeModel
      .findOne({ 'identity.email': email })
      .exec();

    if (!doc) {
      return null;
    }

    return EmployeeMapper.toDomain(doc);
  }
}
