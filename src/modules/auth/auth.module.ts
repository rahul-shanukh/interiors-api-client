// src/modules/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { UserModule } from '../user/user.module';
import { EmployeeModule } from '../employee/employee.module';

@Module({
  imports: [
    UserModule, // Import UserModule to access UserService
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
