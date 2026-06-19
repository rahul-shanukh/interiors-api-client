import { Inject, Injectable } from '@nestjs/common';
import { Employee } from '../../domain/entities/employee.entity';
import type { IEmployeeRepository } from 'src/modules/employee/domain/repositories/employee.repository.interface';
import { EMPLOYEE_REPOSITORY } from 'src/modules/employee/domain/repositories/employee.repository.interface';

@Injectable()
export class RetrieveEmployeesService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: IEmployeeRepository,
  ) {}

  async retrieveAll(): Promise<Employee[]> {
    console.log('Starting retrieveAll... AT SERVICE');
    // Note: If you haven't yet, you will need to add findAll() to your IEmployeeRepository
    // interface and implement it in your EmployeeMongoRepository!
    return await this.employeeRepository.findAll();
  }
}
