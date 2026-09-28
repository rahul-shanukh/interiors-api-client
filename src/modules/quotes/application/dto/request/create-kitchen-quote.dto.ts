import { ApiProperty } from "@nestjs/swagger";
import { BaseQuoteRequestDto } from "../base-quote-request.dto";
import { CalculatorType } from "src/modules/quotes/domain/enums/calculator-type.enum";
import { Equals, ValidateNested } from "class-validator";
import { KitchenConfigurationDto } from "../configurations/kitchen-configuration.dto";
import { Type } from "class-transformer";

export class CreateKitchenQuoteDto extends BaseQuoteRequestDto {
  @ApiProperty({
    enum: [CalculatorType.KITCHEN],
    example: CalculatorType.KITCHEN,
  })
  @Equals(CalculatorType.KITCHEN)
  calculatorType: CalculatorType.KITCHEN = CalculatorType.KITCHEN;

  @ApiProperty({ type: KitchenConfigurationDto })
  @ValidateNested()
  @Type(() => KitchenConfigurationDto)
  configuration!: KitchenConfigurationDto;
}
    