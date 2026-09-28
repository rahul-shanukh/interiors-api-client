import { ApiProperty } from "@nestjs/swagger";
import { BaseQuoteRequestDto } from "../base-quote-request.dto";
import { CalculatorType } from "src/modules/quotes/domain/enums/calculator-type.enum";
import { Type } from "class-transformer";
import { WardrobeConfigurationDto } from "../configurations/wardrobe-configuration.dto";
import { Equals, ValidateNested } from "class-validator";

export class CreateWardrobeQuoteDto extends BaseQuoteRequestDto {
  @ApiProperty({
    enum: [CalculatorType.WARDROBE],
    example: CalculatorType.WARDROBE,
  })
  @Equals(CalculatorType.WARDROBE)
  calculatorType: CalculatorType.WARDROBE = CalculatorType.WARDROBE;

  @ApiProperty({ type: WardrobeConfigurationDto })
  @ValidateNested()
  @Type(() => WardrobeConfigurationDto)
  configuration!: WardrobeConfigurationDto;
}
