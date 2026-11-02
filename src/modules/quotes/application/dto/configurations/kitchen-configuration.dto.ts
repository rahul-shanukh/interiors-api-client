//Backend/interiors-api-client/src/modules/quotes/application/dto/configurations/kitchen-configuration.dto.ts

import { IsString, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class KitchenConfigurationDto {
  @ApiProperty({ example: "Premium" })
  @IsString()
  @IsNotEmpty()
  package!: string;

  @ApiProperty({ example: "Kitchen (Straight)" })
  @IsString()
  @IsNotEmpty()
  layout!: string;

  @ApiProperty({ example: "A: 8ft (Total: 8ft)" })
  @IsString()
  @IsNotEmpty()
  builtupArea!: string;
}
