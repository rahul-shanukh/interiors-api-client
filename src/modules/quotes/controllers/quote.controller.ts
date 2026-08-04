import { Body, Controller, Post } from "@nestjs/common";
import { QuoteService } from "../application/services/quote.service";
import { CreateQuoteDto } from "../application/dto/create-quote.dto";
import { Public } from "src/common/decorators/roles.decorator";
import { ApiCreatedResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateQuoteResponseDto } from "../application/dto/create-quote-response.dto";

@ApiTags("Quotes")
@Controller("quotes")
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Public()
  @Post("request")
  @ApiOperation({
    summary: "Request an interior quote",
    description:
      "Stores quote details, calculates an estimate, and dispatches a notification.",
  })
  @ApiCreatedResponse({
    description: "Quote request was created successfully.",
    type: CreateQuoteResponseDto,
  })
  async requestQuote(
    @Body() createQuoteDto: CreateQuoteDto,
  ): Promise<CreateQuoteResponseDto> {
    return this.quoteService.createQuoteRequest(createQuoteDto);
  }
}
