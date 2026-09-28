import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPhoneNumber,
  IsString,
  ValidateNested,
} from "class-validator";
import { CalculatorType } from "../../domain/enums/calculator-type.enum";
import { CreateWardrobeQuoteDto } from "./request/create-wardrobe-quote.dto";
import { CreateFullHomeQuoteDto } from "./request/create-full-home-quote.dto";
import { CreateKitchenQuoteDto } from "./request/create-kitchen-quote.dto";

export type AnyQuoteRequestDto =
  | CreateFullHomeQuoteDto
  | CreateKitchenQuoteDto
  | CreateWardrobeQuoteDto;

export class QuoteLocationDto {
  @ApiProperty({ example: "Bangalore" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: "Karnataka" })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: "India" })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: 12.9716 })
  @IsNotEmpty()
  @IsNumber()
  latitude!: number;

  @ApiProperty({ example: 77.5946 })
  @IsNotEmpty()
  @IsNumber()
  longitude!: number;
}

/** Fields shared by every quote type. */
export class BaseQuoteRequestDto {
  @ApiProperty({ enum: CalculatorType })
  @IsEnum(CalculatorType)
  @IsNotEmpty()
  calculatorType!: CalculatorType;

  @ApiProperty({ example: "Priya Nair" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: "+919876543210" })
  @IsPhoneNumber()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: "priya.nair@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ type: QuoteLocationDto })
  @ValidateNested()
  @Type(() => QuoteLocationDto)
  location!: QuoteLocationDto;

  @ApiProperty({ example: "recaptcha-token" })
  @IsString()
  @IsNotEmpty()
  recaptchaToken!: string;
}
