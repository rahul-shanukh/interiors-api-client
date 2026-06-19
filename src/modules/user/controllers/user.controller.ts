import { Controller, Post, Body, Req, Param, Delete } from '@nestjs/common';
import type { Request } from 'express';
import { UserService } from '../application/services/user.service';
import { ActivateUserDto } from '../application/dto/activate-user.dto';
import { Public, Roles } from 'src/common/decorators/roles.decorator';
import { DeleteUserService } from '../application/services/delete-user.service';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ActivateUserResponseDto } from '../application/dto/activate-user-response.dto';
import { MessageResponseDto } from 'src/common/dto/message-response.dto';

// The UserController handles user-related HTTP endpoints
@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly deleteUserService: DeleteUserService,
  ) {}

  // POST /user/activate
  // This is the endpoint employees hit when they're activating their account for the first time
  // It must be public because they don't have a session yet
  @Public()
  @Post('activate')
  @ApiOperation({
    summary: 'Activate employee account',
    description:
      'Sets the initial password for an employee account and creates a session.',
  })
  @ApiCreatedResponse({
    description: 'Account activated and session created.',
    type: ActivateUserResponseDto,
  })
  async activate(@Body() dto: ActivateUserDto, @Req() req: Request) {
    console.log('🔍 Session before setting user:', req.session);
    console.log('🔍 Checking the dto:', dto.employeeId);

    const user = await this.userService.activateUser({
      employeeId: dto.employeeId,
      password: dto.password,
    });

    const employee = await this.userService.getEmployeeForUser(user.employeeId);
    req.session.user = {
      userId: user.id.getValue(),
      employeeId: user.employeeId,
      // FIX: Use getProps() to safely access the encapsulated role
      role: employee ? employee.getProps().role.getValue() : 'EMPLOYEE',
      name: employee
        ? `${employee.getProps().name.firstName} ${employee.getProps().name.lastName}`
        : 'Unknown',
    };

    // Manually save the session to Redis
    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) {
          console.error('❌ Session save error:', err);
          reject(err);
        } else {
          console.log('✅ Session saved successfully');
          resolve(true);
        }
      });
    });

    return {
      message: 'Account activated successfully. You are now logged in.',
      userId: user.id.getValue(),
      employeeId: user.employeeId,
    };
  }

  @Roles('ADMIN')
  @Delete(':employeeId')
  @ApiCookieAuth('connect.sid')
  @ApiOperation({
    summary: 'Delete a user by employee ID',
  })
  @ApiParam({
    name: 'employeeId',
    example: 'SE282',
    description: 'Employee identifier for the user account to delete.',
  })
  @ApiOkResponse({
    description: 'User was deleted.',
    type: MessageResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Current session user does not have the ADMIN role.',
  })
  @ApiNotFoundResponse({
    description: 'No user was found for the supplied employee ID.',
  })
  async deleteUser(@Param('employeeId') employeeId: string) {
    return this.deleteUserService.execute(employeeId);
  }
}
