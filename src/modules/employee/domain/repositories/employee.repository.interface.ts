import { Employee } from '../entities/employee.entity';
import { EmployeeId } from '../value-objects/employee-id.vo';

// This Symbol acts as a unique token for NestJS Dependency Injection later
export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY');

export interface IEmployeeRepository {
  save(employee: Employee): Promise<void>;
  findById(id: EmployeeId): Promise<Employee | null>;
  findByEmail(email: string): Promise<Employee | null>;
  findAll(): Promise<Employee[]>;
}
