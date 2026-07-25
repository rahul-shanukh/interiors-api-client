import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

// DTO for the login endpoint
// This is what users provide when they're logging into an already-activated account
export class LoginDto {
  @ApiProperty({
    example: 'SE282',
    description: 'Username or employee identifier used to sign in.',
  })
  @IsString()
  @IsNotEmpty()
  username: string; // Could be employeeId or a separate username depending on your business rules

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Account password.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  password: string; // The password they set during activation
}
