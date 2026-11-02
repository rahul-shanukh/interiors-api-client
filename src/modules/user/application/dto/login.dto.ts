import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
export class LoginDto {
  @ApiProperty({
    example: 'user123',
    description: 'Username or identifier used to sign in.',
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
