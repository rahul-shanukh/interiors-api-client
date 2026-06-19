import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// 1. Infrastructure Imports (Database & Repositories)
import {
  Employee,
  EmployeeSchema,
} from './infrastructure/persistence/mongo/employee.schema';
import { EmployeeMongoRepository } from './infrastructure/persistence/mongo/employee.mongo.repository';

// 2. Domain Imports (Tokens/Interfaces)
import { EMPLOYEE_REPOSITORY } from './domain/repositories/employee.repository.interface';

// 3. Application Imports (Services)
import { CreateEmployeeService } from './application/services/create-employee.service';

// 4. Presentation Imports (Controllers)
import { EmployeeController } from './controllers/employee.controller';

@Module({
  imports: [
    // Register the Mongoose Schema with NestJS
    MongooseModule.forFeature([
      { name: Employee.name, schema: EmployeeSchema },
    ]),
  ],
  controllers: [EmployeeController],
  providers: [
    // The Application Service
    CreateEmployeeService,

    // The Magic Binding: Whenever something asks for EMPLOYEE_REPOSITORY,
    // NestJS will inject an instance of EmployeeMongoRepository.
    {
      provide: EMPLOYEE_REPOSITORY,
      useClass: EmployeeMongoRepository,
    },
  ],
  exports: [
    // Export the token if other modules (like Auth or Payroll) need to read Employee data
    EMPLOYEE_REPOSITORY,
  ],
})
export class EmployeeModule {}
