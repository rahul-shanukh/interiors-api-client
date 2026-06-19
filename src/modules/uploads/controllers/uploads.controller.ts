// src/modules/uploads/controllers/uploads.controller.ts

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UploadsService } from '../application/services/uploads.service';
import { GenerateUrlDto } from '../application/dto/generate-url.dto';
import type { Request } from 'express';
import { ConfirmUploadDto } from '../application/dto/confirm-upload.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  ConfirmUploadResponseDto,
  PresignedUrlResponseDto,
} from '../application/dto/upload-response.dto';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('presigned-url')
  @Roles('ADMIN')
  @Throttle({ default: { limit: 3, ttl: 10000 } }) // ← milliseconds Limit to 10 requests per minute
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({
    summary: 'Create presigned upload URLs',
    description:
      'Creates pending media records and returns temporary upload URLs for direct cloud storage upload.',
  })
  @ApiOkResponse({
    description: 'Presigned URLs were generated.',
    type: [PresignedUrlResponseDto],
  })
  @ApiForbiddenResponse({
    description: 'Current session user does not have the ADMIN role.',
  })
  async getPresignedUrl(@Body() dto: GenerateUrlDto, @Req() req: Request) {
    const { userId, name } = req.session.user!;

    return this.uploadsService.generateUploadUrl(dto.files, dto.provider, {
      adminId: userId,
      adminName: name,
    });
  }

  @Post('confirm')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('connect.sid')
  @ApiOperation({
    summary: 'Confirm uploaded asset',
    description:
      'Marks a pending media asset as confirmed after direct cloud upload succeeds.',
  })
  @ApiOkResponse({
    description: 'Upload was confirmed.',
    type: ConfirmUploadResponseDto,
  })
  @ApiForbiddenResponse({
    description: 'Current session user does not have the ADMIN role.',
  })
  async confirmUpload(@Body() dto: ConfirmUploadDto) {
    const asset = await this.uploadsService.confirmUpload(dto.fileKey);
    const props = asset.getProps();

    return {
      fileKey: props.fileKey,
      publicUrl: props.publicUrl,
      status: props.status,
    };
  }
}
