import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

// The LoginDto defines what data users must provide when logging in
// This validates that both username and password are present and are strings
export class LoginDto {
  @ApiProperty({
    example: 'SE282',
    description: 'Username or employee identifier used to sign in.',
  })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Account password.',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
