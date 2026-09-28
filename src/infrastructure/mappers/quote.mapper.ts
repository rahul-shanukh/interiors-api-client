import { CalculatorType } from "src/modules/quotes/domain/enums/calculator-type.enum";
import { CreateFullHomeQuoteDto } from "src/modules/quotes/application/dto/request/create-full-home-quote.dto";
import { AnyQuoteRequestDto } from "src/modules/quotes/application/dto/base-quote-request.dto";
import { CreateKitchenQuoteDto } from "src/modules/quotes/application/dto/request/create-kitchen-quote.dto";
import { CreateWardrobeQuoteDto } from "src/modules/quotes/application/dto/request/create-wardrobe-quote.dto";

export class QuoteMapper {
  static toPersistence(
    dto: AnyQuoteRequestDto,
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
      quotesRequested: {},
      leadStatus: "NEW_LEAD",
      contactStatus: "UNCONTACTED",
      dealStatus: "PENDING",
      fingerPrint,
    };

    switch (calculatorType) {
      case CalculatorType.FULL_HOME:
        return { ...baseCount, ...this.mapFullHome(dto) };

      case CalculatorType.KITCHEN:
        return { ...baseCount, ...this.mapKitchen(dto) };

      case CalculatorType.WARDROBE:
        return { ...baseCount, ...this.mapWardrobe(dto) };

      default:
        throw new Error(`Unsupported calculator type: ${calculatorType}`);
    }
  }

  private static mapFullHome(dto: AnyQuoteRequestDto) {
    const fullHomeConfig = dto as CreateFullHomeQuoteDto;

    return {
      bhkType: fullHomeConfig.configuration.bhkType,
      package: fullHomeConfig.configuration.package,
      rooms: fullHomeConfig.configuration.rooms,
      builtupArea: fullHomeConfig.configuration.builtupArea,
    };
  }

  private static mapKitchen(dto: AnyQuoteRequestDto) {
    const kitchenConfig = dto as CreateKitchenQuoteDto;

    return {
      layout: kitchenConfig.configuration.layout,
      package: kitchenConfig.configuration.package,
      builtupArea: kitchenConfig.configuration.builtupArea,
    };
  }

  private static mapWardrobe(dto: AnyQuoteRequestDto) {
    const wardrobeConfig = dto as CreateWardrobeQuoteDto;

    return {
      wardrobeType: wardrobeConfig.configuration.wardrobeType,
      package: wardrobeConfig.configuration.package,
      dimensions: wardrobeConfig.configuration.dimensions,
      length: wardrobeConfig.configuration.length,
      height: wardrobeConfig.configuration.height,
      materials: wardrobeConfig.configuration.materials,
      accessories: wardrobeConfig.configuration.accessories,
    };
  }
}
