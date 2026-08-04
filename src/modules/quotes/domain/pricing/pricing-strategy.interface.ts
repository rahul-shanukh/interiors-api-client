import { CreateQuoteDto } from "../../application/dto/create-quote.dto";
import { CalculatorType } from "../enums/calculator-type.enum";

export interface PricingStrategy {
  supports(type: CalculatorType): boolean;
  calculateEstimate(quoteRequest: CreateQuoteDto): number;
}
