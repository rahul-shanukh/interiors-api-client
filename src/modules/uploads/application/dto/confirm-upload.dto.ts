// src/modules/uploads/application/dto/confirm-upload.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ConfirmUploadDto {
  @ApiProperty({
    example: 'quotes/client-render.webp',
    description: 'Storage object key returned by the presigned upload flow.',
  })
  @IsString()
  fileKey!: string;
}
