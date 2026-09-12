import { Body, Controller, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { QuoteService } from "../application/services/quote.service";
//import { CreateQuoteDto } from "../application/dto/create-quote.dto";
import { Public } from "src/common/decorators/roles.decorator";
import {
  ApiCreatedResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { CreateQuoteResponseDto } from "../application/dto/response/create-quote-response.dto";
import { CreateFullHomeQuoteDto } from "../application/dto/request/create-full-home-quote.dto";

@ApiTags("Quotes")
@Controller("quotes")
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Public()
  @Post("request")
  @ApiOperation({
    summary: "Request an interior quote",
    description:
      "Checks rate limits, stores quote details, calculates an estimate, and dispatches a notification.",
  })
  @ApiCreatedResponse({
    description: "Quote request was created successfully.",
    type: CreateQuoteResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: "Too many requests. Rate limit exceeded.",
  })
  async requestQuote(
    @Body() createQuoteDto: CreateFullHomeQuoteDto,
    @Req() request: Request,
  ): Promise<CreateQuoteResponseDto> {
    return this.quoteService.createQuoteRequest(
      createQuoteDto,
      request.ip ?? request.socket.remoteAddress ?? "",
    );
  }
}
