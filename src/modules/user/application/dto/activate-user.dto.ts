import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength } from 'class-validator';

// DTO for user activation - now simplified to just employee ID and password
// The employee ID will serve as both the identifier and the username
export class ActivateUserDto {
  @ApiProperty({
    example: 'SE282',
    description: 'Employee identifier for the account being activated.',
  })
  @IsString()
  @IsNotEmpty()
  employeeId: string; // The employee ID from the employee collection

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Password to set for the employee account.',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  password: string; // The password they want to set for their account
}
