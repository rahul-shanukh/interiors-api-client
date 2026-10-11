import {
  Body,
  Controller,
  Headers,
  ParseUUIDPipe,
  Post,
  Req,
} from "@nestjs/common";
import { QuoteValidationPipe } from "src/modules/quotes/application/pipes/quote-validation.pipe";
import { Request } from "express";
import { QuoteService } from "../application/services/quote.service";
import { Public } from "src/common/decorators/roles.decorator";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiHeader,
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
import { Logger } from "@nestjs/common";

@ApiTags("Quotes")
@Controller("quotes")
@ApiExtraModels(
  CreateFullHomeQuoteDto,
  CreateKitchenQuoteDto,
  CreateWardrobeQuoteDto,
)
export class QuoteController {
  private readonly logger = new Logger(QuoteController.name);
  constructor(private readonly quoteService: QuoteService) {}

  @Public()
  @Post("request")
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    description: "UUID v4 identifying one submission; reuse it for retries.",
    schema: { type: "string", format: "uuid" },
  })
  @ApiResponse({
    status: 400,
    description:
      "Invalid request data or missing/invalid Idempotency-Key header.",
  })
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
    @Headers("idempotency-key") idempotencyKey: string,
  ): Promise<CreateQuoteResponseDto> {
    // Reject missing or invalid keys before calling the service (HTTP 400).
    await new ParseUUIDPipe({ version: "4" }).transform(idempotencyKey, {
      type: "custom",
      data: "Idempotency-Key",
    });
    this.logger.log({
      event: "quote_request_received",
      calculatorType: createQuoteDto.calculatorType,
    });
    return this.quoteService.createQuoteRequest(
      createQuoteDto,
      request.ip ?? request.socket.remoteAddress ?? "",
      idempotencyKey,
    );
  }
}
