// src/modules/quotes/application/pipes/quote-validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { CalculatorType } from "../../domain/enums/calculator-type.enum";
import { CreateFullHomeQuoteDto } from "../dto/request/create-full-home-quote.dto";
import { CreateKitchenQuoteDto } from "../dto/request/create-kitchen-quote.dto";
import { CreateWardrobeQuoteDto } from "../dto/request/create-wardrobe-quote.dto";
import { BaseQuoteRequestDto } from "../dto/base-quote-request.dto";

@Injectable()
export class QuoteValidationPipe implements PipeTransform {
  async transform(value: any) {
    if (!value || typeof value !== "object") {
      throw new BadRequestException(
        "Validation failed: payload must be an object",
      );
    }

    let targetClass: typeof BaseQuoteRequestDto;

    switch (value.calculatorType) {
      case CalculatorType.FULL_HOME:
        targetClass = CreateFullHomeQuoteDto;
        break;
      case CalculatorType.KITCHEN:
        targetClass = CreateKitchenQuoteDto;
        break;
      case CalculatorType.WARDROBE:
        targetClass = CreateWardrobeQuoteDto;
        break;
      default:
        throw new BadRequestException(
          `Unsupported calculatorType: ${value.calculatorType}`,
        );
    }

    const object = plainToInstance(targetClass, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    if (errors.length > 0) {
      const errorMessages = errors.flatMap((err) =>
        Object.values(err.constraints || {}),
      );
      throw new BadRequestException({
        message: "Validation failed",
        errors: errorMessages,
      });
    }

    return object;
  }
}
