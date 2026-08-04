import { CreateQuoteDto } from "../../modules/quotes/application/dto/create-quote.dto";

export class QuoteMapper {
  static toPersistence(dto: CreateQuoteDto, estimatedPrice: number) {
    return {
      calculatorType: dto.calculatorType,
      bhkType: dto.bhkType,
      rooms: dto.rooms,
      package: dto.package,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      estimatedPrice,
      leadStatus: "NEW_LEAD",
      contactStatus: "UNCONTACTED",
      dealStatus: "PENDING",
    };
  }
}
