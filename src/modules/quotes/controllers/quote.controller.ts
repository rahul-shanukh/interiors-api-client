import { Body, Controller, Post, Req } from "@nestjs/common";
import { QuoteValidationPipe } from "src/modules/quotes/application/pipes/quote-validation.pipe";
import { Request } from "express";
import { QuoteService } from "../application/services/quote.service";
import { Public } from "src/common/decorators/roles.decorator";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from "@nestjs/swagger";
import { CreateQuoteResponseDto } from "../application/dto/response/create-quote-response.dto";
import { AnyQuoteRequestDto } from "../application/dto/base-quote-request.dto";
import { CreateFullHomeQuoteDto } from "../application/dto/request/create-full-home-quote.dto";
import { CreateKitchenQuoteDto } from "../application/dto/request/create-kitchen-quote.dto";
import { CreateWardrobeQuoteDto } from "../application/dto/request/create-wardrobe-quote.dto";

@ApiTags("Quotes")
@Controller("quotes")
@ApiExtraModels(
  CreateFullHomeQuoteDto,
  CreateKitchenQuoteDto,
  CreateWardrobeQuoteDto,
)
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Public()
  @Post("request")
  @ApiOperation({
    summary: "Request an interior quote",
    description:
      "Checks rate limits, stores quote details, calculates an estimate, and dispatches a notification.",
  })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(CreateFullHomeQuoteDto) },
        { $ref: getSchemaPath(CreateKitchenQuoteDto) },
        { $ref: getSchemaPath(CreateWardrobeQuoteDto) },
      ],
    },
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
    @Body(QuoteValidationPipe) createQuoteDto: AnyQuoteRequestDto,
    @Req() request: Request,
  ): Promise<CreateQuoteResponseDto> {
    console.log("Received quote request:", createQuoteDto);
    return this.quoteService.createQuoteRequest(
      createQuoteDto,
      request.ip ?? request.socket.remoteAddress ?? "",
    );
  }
}
