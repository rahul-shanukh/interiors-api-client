export type NormalizedQuoteData = {
  calculatorType: string;
  bhkType: string;
  builtupArea: string;
  package: string;
  email: string;
  phone: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  rooms: {
    living: number;
    kitchen: number;
    bedroom: number;
    bathroom: number;
    dining: number;
  };
};

/**
 * Normalizes quote DTOs to a standard format for duplicate detection
 */
export function normalizeQuoteData(dto: any): NormalizedQuoteData {
  // Handle different calculator types - they may have different structures
  return {
    calculatorType: dto.calculatorType,
    bhkType: dto.configuration.bhkType,
    builtupArea: dto.configuration.builtupArea,
    package: dto.configuration.package,
    email: dto.email.trim().toLowerCase(),
    phone: dto.phone,
    location: {
      city: dto.location.city,
      state: dto.location.state,
      country: dto.location.country,
    },
    rooms: {
      living: dto.configuration.rooms.living,
      kitchen: dto.configuration.rooms.kitchen,
      bedroom: dto.configuration.rooms.bedroom,
      bathroom: dto.configuration.rooms.bathroom,
      dining: dto.configuration.rooms.dining ?? 0,
    },
  };
}
