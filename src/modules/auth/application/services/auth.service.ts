// src/modules/auth/application/services/auth.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/modules/user/application/services/user.service';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(
    username: string,
    password: string,
  ): Promise<{
    userId: string;
    employeeId: string;
    role: string;
    name: string;
  }> {
    // Step 1: Find the user by their username
    const user = await this.userService.findByUsername(username);

    if (!user) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Step 2: Check if the user's account is active
    if (!user.canLogin()) {
      throw new UnauthorizedException(
        'Your account is not active. Please contact support.',
      );
    }

    // Step 3: Verify the password matches
    const isPasswordValid = await user.verifyPassword(password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid username or password');
    }

    // Step 4: Update the last login timestamp
    await this.userService.updateLastLogin(user);

    // Step 5: Delegate employee fetch to UserService — no direct repo access
    const employee = await this.userService.getEmployeeForUser(user.employeeId);

    if (!employee) {
      throw new UnauthorizedException('Employee data not found');
    }

    return {
      userId: user.id.getValue(),
      employeeId: user.employeeId,
      role: employee.getProps().role.getValue(),
      name: `${employee.getProps().name.firstName} ${employee.getProps().name.lastName}`,
    };
  }
}
