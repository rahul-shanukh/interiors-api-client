import { CalculatorType } from "../../domain/enums/calculator-type.enum";
import { AnyQuoteRequestDto } from "../dto/base-quote-request.dto";

export type NormalizedQuoteData = {
  calculatorType: string;
  email: string;
  phone: string;
  package: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  specificationsKey: string;
};

/**
 * Normalizes quote DTOs to a standard format for duplicate detection
 */
export function normalizeQuoteData(
  dto: AnyQuoteRequestDto,
): NormalizedQuoteData {
  // Handle different calculator types - they may have different structures
  let specificationsKey = "";
  let packageName = "";

  switch (dto.calculatorType) {
    case CalculatorType.FULL_HOME:
      packageName = dto.configuration.package;
      // Combine rooms & bhk into a deterministic string representation for fingerprinting
      specificationsKey = `${dto.configuration.bhkType}-${dto.configuration.builtupArea}-L${dto.configuration.rooms.living}B${dto.configuration.rooms.bedroom}K${dto.configuration.rooms.kitchen}`;
      break;

    case CalculatorType.KITCHEN:
      packageName = dto.configuration.package;
      // Combine layout & area size for kitchen fingerprinting
      specificationsKey = `${dto.configuration.layout}-${dto.configuration.builtupArea}`;
      break;

    case CalculatorType.WARDROBE:
      packageName = dto.configuration.package;
      specificationsKey = `${dto.configuration.wardrobeType}-${dto.configuration.dimensions.widthFeet}x${dto.configuration.dimensions.heightFeet}#${dto.configuration.materials.core}-${dto.configuration.materials.finish}$${dto.configuration.accessories.join(",")}`;
      break;
  }

  return {
    calculatorType: dto.calculatorType,
    email: dto.email.trim().toLowerCase(),
    phone: dto.phone.trim(),
    package: packageName,
    location: {
      city: dto.location.city.trim().toLowerCase(),
      state: dto.location.state.trim().toLowerCase(),
      country: dto.location.country.trim().toLowerCase(),
    },
    specificationsKey,
  };
}
