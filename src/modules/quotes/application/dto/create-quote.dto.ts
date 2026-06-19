//backend\src\modules\quotes\application\dto\create-quote.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  ValidateNested,
  IsNumber,
  Min,
  IsPhoneNumber,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

class RoomCountsDto {
  @ApiProperty({ example: 1, minimum: 0, description: 'Living rooms count.' })
  @IsNumber()
  @Min(0)
  living!: number;

  @ApiProperty({ example: 1, minimum: 0, description: 'Kitchens count.' })
  @IsNumber()
  @Min(0)
  kitchen!: number;

  @ApiProperty({ example: 2, minimum: 0, description: 'Bedrooms count.' })
  @IsNumber()
  @Min(0)
  bedroom!: number;

  @ApiProperty({ example: 2, minimum: 0, description: 'Bathrooms count.' })
  @IsNumber()
  @Min(0)
  bathroom!: number;

  @ApiPropertyOptional({
    example: 1,
    minimum: 0,
    description: 'Dining rooms count.',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  dining!: number;
}

export class CreateQuoteDto {
  @ApiProperty({
    example: '2 BHK',
    description: 'Home or apartment configuration.',
  })
  @IsString()
  @IsNotEmpty()
  bhkType!: string;

  @ApiProperty({
    type: RoomCountsDto,
    description: 'Room counts used to calculate the estimate.',
  })
  @ValidateNested()
  @Type(() => RoomCountsDto)
  rooms!: RoomCountsDto;

  @ApiProperty({
    example: 'Premium',
    description: 'Selected interior package.',
  })
  @IsString()
  @IsNotEmpty()
  package!: string;

  @ApiProperty({
    example: 'Priya Nair',
    description: 'Client name.',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({
    example: '+919876543210',
    description: 'Indian phone number for quote follow-up.',
  })
  @IsPhoneNumber('IN')
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({
    example: 'priya.nair@example.com',
    description: 'Client email address.',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}
