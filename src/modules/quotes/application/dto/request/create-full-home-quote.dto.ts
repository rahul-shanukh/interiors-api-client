import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { Equals, ValidateNested } from "class-validator";
import { CalculatorType } from "../../../domain/enums/calculator-type.enum";
import { FullHomeConfigurationDto } from "../configurations/full-home-configuration.dto";
import { BaseQuoteRequestDto } from "../base-quote-request.dto";

/** Request DTO for creating a Full Home quote. */
export class CreateFullHomeQuoteDto extends BaseQuoteRequestDto {
  @ApiProperty({
    enum: [CalculatorType.FULL_HOME],
    example: CalculatorType.FULL_HOME,
  })
  @Equals(CalculatorType.FULL_HOME)
  calculatorType: CalculatorType.FULL_HOME = CalculatorType.FULL_HOME;

  @ApiProperty({ type: FullHomeConfigurationDto })
  @ValidateNested()
  @Type(() => FullHomeConfigurationDto)
  configuration!: FullHomeConfigurationDto;
}
