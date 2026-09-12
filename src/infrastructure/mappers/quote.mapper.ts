import { CalculatorType } from "src/modules/quotes/domain/enums/calculator-type.enum";
import { CreateFullHomeQuoteDto } from "src/modules/quotes/application/dto/request/create-full-home-quote.dto";

export class QuoteMapper {
  static toPersistence(
    dto: CreateFullHomeQuoteDto,
    estimatedPrice: number,
    pricingVersion: string,
    pricingSnapshot: Record<string, unknown>,
    customerId: string,
    customerKey: string,
    calculatorType: string,
    fingerPrint: string,
  ) {
    const baseCount = {
      calculatorType,
      customer: customerId,
      customerKey,
      location: dto.location,
      estimatedPrice,
      pricingVersion,
      pricingSnapshot,
      quotesRequested: {}, // Use this for generic UTMs/metadata if needed
      leadStatus: "NEW_LEAD",
      contactStatus: "UNCONTACTED",
      dealStatus: "PENDING",
      fingerPrint,
    };

    switch (calculatorType) {
      case CalculatorType.FULL_HOME:
        return { ...baseCount, ...this.mapFullHome(dto) };

      default:
        throw new Error(`Unsupported calculator type: ${calculatorType}`);
    }
  }

  private static mapFullHome(dto: CreateFullHomeQuoteDto) {
    return {
      bhkType: dto.configuration.bhkType,
      package: dto.configuration.package,
      rooms: dto.configuration.rooms,
      builtupArea: dto.configuration.builtupArea,
    };
  }

  private static mapKitchen(dto: CreateFullHomeQuoteDto) {
    return {
      package: dto.configuration.package,
      rooms: dto.configuration.rooms,
      builtupArea: dto.configuration.builtupArea,
    };
  }
}
