import { ApiProperty } from '@nestjs/swagger';

export class CreateQuoteResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether the quote request was stored successfully.',
  })
  success!: boolean;

  @ApiProperty({
    example: 'Quote generated successfully',
    description: 'Quote creation result message.',
  })
  message!: string;

  @ApiProperty({
    example: '681ef9c6f24f8f2a2e2d5c1b',
    description: 'Stored quote identifier.',
  })
  quoteId!: string;

  @ApiProperty({
    example: 350000,
    description: 'Calculated estimate amount.',
  })
  estimatedPrice!: number;
}
