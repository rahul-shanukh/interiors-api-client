import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { CreateEmployeeService } from '../application/services/create-employee.service';
import { CreateEmployeeDto } from '../application/dto/create-employee.dto';

import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

@ApiTags('Employees')
@Controller('employees')
export class EmployeeController {
  constructor(private readonly createEmployeeService: CreateEmployeeService) {}

  @Roles('ADMIN')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({
    summary: 'Create employee',
    description: 'Creates an employee record. Requires an ADMIN session.',
  })
  @ApiCreatedResponse({
    description: 'Employee was created successfully.',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Current session user does not have the ADMIN role.',
  })
  @ApiConflictResponse({
    description: 'Employee ID or email already exists.',
  })
  async createEmployee(
    @Body() createEmployeeDto: CreateEmployeeDto,
  ): Promise<{ message: string }> {
    await this.createEmployeeService.execute(createEmployeeDto);

    return {
      message: 'Employee created successfully',
    };
  }
}
