// src/modules/user/application/services/user.service.ts

import { Inject, Injectable } from '@nestjs/common';
import type { UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import type { IEmployeeRepository } from 'src/modules/employee/domain/repositories/employee.repository.interface';
import { EMPLOYEE_REPOSITORY } from 'src/modules/employee/domain/repositories/employee.repository.interface';
import { EmployeeId } from 'src/modules/employee/domain/value-objects/employee-id.vo';
import { DomainException } from 'src/common/exceptions/domain.exception';
import { UserErrorCode } from 'src/common/constants/error-codes.generated';

@Injectable()
export class UserService {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,

    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: IEmployeeRepository,
  ) {}

  async activateUser(props: {
    employeeId: string;
    password: string;
  }): Promise<User> {
    const empIdVo = EmployeeId.create(props.employeeId);
    const employee = await this.employeeRepository.findById(empIdVo);

    if (!employee) {
      // ✅ DomainException — business rule violation
      throw new DomainException(
        'Employee ID not found. Please contact HR.',
        UserErrorCode.NOT_FOUND,
      );
    }

    const existingUser = await this.userRepository.findByEmployeeId(
      props.employeeId,
    );

    if (existingUser) {
      // ✅ DomainException — business rule violation
      throw new DomainException(
        'This employee has already activated their account.',
        UserErrorCode.ACCOUNT_ALREADY_EXISTS,
      );
    }

    const user = await User.create({
      plainPassword: props.password,
      employeeId: props.employeeId,
    });

    return await this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findByUsername(username);
  }

  async updateLastLogin(user: User): Promise<void> {
    await this.userRepository.updateLastLogin(user.id.getValue(), new Date());
  }

  // ✅ AuthService delegates here — no direct repo access in AuthService
  async getEmployeeForUser(employeeId: string) {
    const empIdVo = EmployeeId.create(employeeId);
    return await this.employeeRepository.findById(empIdVo);
  }
}
