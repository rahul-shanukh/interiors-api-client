//src/modules/quotes/application/dto/configurations/full-home-configuration.dto.ts

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class FullHomeRoomCountsDto {
  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  living!: number;

  @ApiProperty({ example: 1, minimum: 0 })
  @IsNumber()
  @Min(0)
  kitchen!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsNumber()
  @Min(0)
  bedroom!: number;

  @ApiProperty({ example: 2, minimum: 0 })
  @IsNumber()
  @Min(0)
  bathroom!: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dining?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  balcony?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  pooja?: number;

  @ApiPropertyOptional({ example: 1, minimum: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  laundry?: number;
}

export class FullHomeConfigurationDto {
  @ApiProperty({
    example: "2BHK",
    enum: ["1BHK", "2BHK", "3BHK", "4+ BHK / Villa"],
  })
  @IsString()
  @IsIn(["1BHK", "2BHK", "3BHK", "4+ BHK / Villa"])
  bhkType!: string;

  @ApiProperty({ example: "1500 sqft" })
  @IsString()
  builtupArea!: string;

  @ApiProperty({ type: FullHomeRoomCountsDto })
  @ValidateNested()
  @Type(() => FullHomeRoomCountsDto)
  rooms!: FullHomeRoomCountsDto;

  @ApiProperty({ example: "PREMIUM" })
  @IsString()
  @IsIn(["ESSENTIAL", "STANDARD", "PREMIUM", "LUXURY", "CUSTOM"])
  package!: string;

  @ApiPropertyOptional({ example: "MODERN" })
  @IsOptional()
  @IsString()
  designStyle?: string;

  @ApiPropertyOptional({ example: ["Warm lighting", "Minimal cabinets"] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  designPreferences?: string[];
}
