import { Injectable, Inject, ConflictException } from '@nestjs/common';
import type { IEmployeeRepository } from '../../domain/repositories/employee.repository.interface';
import { EMPLOYEE_REPOSITORY } from '../../domain/repositories/employee.repository.interface';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeId } from '../../domain/value-objects/employee-id.vo';
import { Name } from '../../domain/value-objects/name.vo';
import { EmployeeRole } from '../../domain/value-objects/employee-role.vo';
import { Address } from '../../domain/value-objects/address.vo';
import { CreateEmployeeDto } from '../dto/create-employee.dto';

@Injectable()
export class CreateEmployeeService {
  constructor(
    // Inject the generic interface, NOT the Mongoose implementation!
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: IEmployeeRepository,
  ) {}

  async execute(dto: CreateEmployeeDto): Promise<void> {
    // 1. Convert primitive DTO strings into strict Value Objects
    const employeeId = EmployeeId.create(dto.empId);
    const name = Name.create(dto.firstName, dto.lastName);
    const role = EmployeeRole.create(dto.role);

    const addresses = dto.addresses.map((addr) =>
      Address.create({
        type: addr.type,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        postalCode: addr.postalCode,
        country: addr.country,
      }),
    );

    // 2. Check if the employee already exists (Business Rule Orchestration)
    const existingEmployee = await this.employeeRepository.findById(employeeId);
    if (existingEmployee) {
      throw new ConflictException(
        `Employee with ID ${dto.empId} already exists.`,
      );
    }

    const existingEmail = await this.employeeRepository.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException(
        `Employee with email ${dto.email} already exists.`,
      );
    }

    // 3. Create the pure Domain Entity (status defaults to ACTIVE automatically)
    const newEmployee = Employee.create(employeeId, {
      name,
      email: dto.email,
      role,
      addresses,
      managerId: null, // Assuming new hires don't have a manager assigned immediately
    });

    // 4. Persist to the database
    // The repository will automatically use the Mapper to convert this to Mongoose format
    await this.employeeRepository.save(newEmployee);
  }
}
