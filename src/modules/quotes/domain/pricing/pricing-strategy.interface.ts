import { AnyQuoteRequestDto } from "../../application/dto/base-quote-request.dto";
import { CalculatorType } from "../enums/calculator-type.enum";

export interface PricingStrategy {
  readonly pricingVersion: string;
  supports(type: CalculatorType): boolean;
  calculateEstimate(quoteRequest: AnyQuoteRequestDto): number;
  getPricingSnapshot(): Record<string, unknown>;
}
