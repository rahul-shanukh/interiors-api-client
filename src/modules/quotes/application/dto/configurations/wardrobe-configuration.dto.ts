// src/modules/quotes/application/dto/configurations/wardrobe-configuration.dto.ts

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";

export class DimensionsDto {
  @ApiProperty({ example: 6, description: "Width in feet", minimum: 1 })
  @IsNumber()
  @Min(1)
  widthFeet!: number;

  @ApiProperty({ example: 8, description: "Height in feet", minimum: 1 })
  @IsNumber()
  @Min(1)
  heightFeet!: number;
}

export class MaterialsDto {
  @ApiProperty({ example: "HDHMR", description: "Core material type" })
  @IsString()
  @IsNotEmpty()
  core!: string;

  @ApiProperty({ example: "Laminate", description: "Finish material type" })
  @IsString()
  @IsNotEmpty()
  finish!: string;
}

export class WardrobeConfigurationDto {
  @ApiProperty({
    example: "Sliding Door",
    description: "Type of wardrobe structure",
  })
  @IsString()
  @IsNotEmpty()
  wardrobeType!: string;

  @ApiProperty({ example: "6", description: "Length display value" })
  @IsString()
  length!: string;

  @ApiProperty({ example: "8", description: "Height display value" })
  @IsString()
  height!: string;

  @ApiPropertyOptional({ example: "PREMIUM", description: "Package tier" })
  @IsOptional()
  @IsString()
  package!: string;

  @ApiProperty({ type: DimensionsDto })
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions!: DimensionsDto;

  @ApiProperty({ type: MaterialsDto })
  @ValidateNested()
  @Type(() => MaterialsDto)
  materials!: MaterialsDto;

  @ApiProperty({
    example: ["Drawers", "LED Lighting"],
    type: [String],
    description: "List of selected accessories",
  })
  @IsArray()
  @IsString({ each: true })
  accessories!: string[];
}
