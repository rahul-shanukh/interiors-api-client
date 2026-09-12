import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    example: '681ef9c6f24f8f2a2e2d5c1b',
    description: 'Internal user identifier.',
  })
  userId!: string;

  @ApiProperty({
    example: 'SE282',
    description: 'Employee identifier linked to the user account.',
  })
  employeeId!: string;

  @ApiProperty({
    example: 'ADMIN',
    description: 'Current user role.',
  })
  role!: string;

  @ApiProperty({
    example: 'System Admin',
    description: 'Display name for the authenticated user.',
    required: false,
  })
  name?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'Login successful',
    description: 'Authentication result message.',
  })
  message!: string;

  @ApiProperty({
    type: AuthUserDto,
    description: 'Authenticated user session payload.',
  })
  user!: AuthUserDto;
}

export class CurrentUserResponseDto {
  @ApiProperty({
    type: AuthUserDto,
    description: 'Current authenticated user from the session.',
  })
  user!: AuthUserDto;
}
