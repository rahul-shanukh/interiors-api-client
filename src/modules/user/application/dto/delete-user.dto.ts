import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class DeleteUerDto {
  @ApiProperty({
    example: 'SE282',
    description: 'User identifier to delete.',
  })
  @IsNotEmpty()
  @IsString()
  userId: string;
}
