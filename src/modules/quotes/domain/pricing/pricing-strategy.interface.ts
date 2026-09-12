import { CreateFullHomeQuoteDto } from "../../application/dto/request/create-full-home-quote.dto";
import { CalculatorType } from "../enums/calculator-type.enum";

export interface PricingStrategy {
  readonly version: string;
  supports(type: CalculatorType): boolean;
  calculateEstimate(quoteRequest: CreateFullHomeQuoteDto): number;
  getPricingSnapshot(): Record<string, unknown>;
}
