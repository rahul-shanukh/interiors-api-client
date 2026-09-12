// src/modules/uploads/application/dto/generate-url.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsString,
  Max,
  Min,
  Matches,
  ValidateNested,
  ArrayMaxSize,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export const SUPPORTED_PROVIDERS = ['r2', 'gcs'] as const;
export type StorageProviderType = (typeof SUPPORTED_PROVIDERS)[number];

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export class FileItemDto {
  @ApiProperty({
    example: 'living-room-render.webp',
    description: 'Original filename to upload.',
    pattern: '^[\\w\\-. ]+$',
  })
  @IsString()
  @Matches(/^[\w\-. ]+$/, { message: 'Filename contains invalid characters' })
  fileName!: string;

  @ApiProperty({
    enum: ALLOWED_MIME_TYPES,
    example: 'image/webp',
    description: 'Allowed file MIME type.',
  })
  @IsIn(ALLOWED_MIME_TYPES, { message: 'File type not allowed' })
  mimeType!: string;

  @ApiProperty({
    example: 524288,
    minimum: 1,
    maximum: MAX_FILE_SIZE,
    description: 'File size in bytes.',
  })
  @IsNumber()
  @Min(1, { message: 'File size must be greater than 0' })
  @Max(MAX_FILE_SIZE, { message: 'File size exceeds 10MB limit' })
  fileSize!: number;

  @ApiProperty({
    example: 'portfolio',
    description: 'Logical upload category.',
  })
  @IsString({ message: 'Category must be a valid string' })
  category!: string;
}

export class GenerateUrlDto {
  @ApiProperty({
    type: [FileItemDto],
    minItems: 1,
    maxItems: 3,
    description: 'Files that need presigned upload URLs.',
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1, { message: 'At least one file is required' })
  @ArrayMaxSize(3, { message: 'Maximum 3 files allowed per request' })
  @Type(() => FileItemDto)
  files!: FileItemDto[];

  @ApiProperty({
    enum: SUPPORTED_PROVIDERS,
    example: 'r2',
    description: 'Storage provider to use for the upload.',
  })
  @IsIn(SUPPORTED_PROVIDERS, { message: 'Unsupported storage provider' })
  provider!: StorageProviderType;
}
