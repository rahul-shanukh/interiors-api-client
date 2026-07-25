import { ApiProperty } from '@nestjs/swagger';

export class ActivateUserResponseDto {
  @ApiProperty({
    example: 'Account activated successfully. You are now logged in.',
    description: 'Activation result message.',
  })
  message!: string;

  @ApiProperty({
    example: '681ef9c6f24f8f2a2e2d5c1b',
    description: 'Created or activated user identifier.',
  })
  userId!: string;

  @ApiProperty({
    example: 'SE282',
    description: 'Employee identifier linked to the activated user.',
  })
  employeeId!: string;
}
