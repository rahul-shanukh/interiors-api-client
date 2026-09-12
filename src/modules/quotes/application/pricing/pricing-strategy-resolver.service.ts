import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { CalculatorType } from "../../domain/enums/calculator-type.enum";
import { PricingStrategy } from "../../domain/pricing/pricing-strategy.interface";

export const PRICING_STRATEGIES = Symbol("PRICING_STRATEGIES");

@Injectable()
export class PricingStrategyResolver {
  constructor(
    @Inject(PRICING_STRATEGIES)
    private readonly strategies: PricingStrategy[],
  ) {}

  resolve(calculatorType: CalculatorType): PricingStrategy {
    const strategy = this.strategies.find((strategy) =>
      strategy.supports(calculatorType),
    );

    if (!strategy) {
      throw new BadRequestException(
        `No pricing strategy found for calculator type: ${calculatorType}`,
      );
    }

    return strategy;
  }
}
