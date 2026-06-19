// src/infrastructure/storage/adapters/cloudflare-r2.adapter.ts

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  PresignedUrlResponse,
} from '../interface/storage.interface';
import { InfrastructureException } from 'src/common/exceptions/infrastructure.exception';
import { MediaErrorCode } from 'src/common/constants/error-codes.generated';

@Injectable()
export class CloudflareR2Adapter implements IStorageProvider {
  private readonly logger = new Logger(CloudflareR2Adapter.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicDomain: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.getOrThrow<string>('R2_ACCOUNT_ID');
    const accessKeyId =
      this.configService.getOrThrow<string>('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.getOrThrow<string>(
      'R2_SECRET_ACCESS_KEY',
    );

    this.bucket = this.configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicDomain =
      this.configService.getOrThrow<string>('R2_PUBLIC_DOMAIN');

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
      // production: explicit timeouts prevent hanging requests
      requestHandler: {
        requestTimeout: 5000, // 5s — R2 should respond within this
        connectionTimeout: 3000,
      } as any,
    });
  }
  async generatePresignedUrl(
    fileKey: string,
    mimeType: string,
    expiresInSeconds = 60,
    fileSize?: number,
    checksum?: string,
  ): Promise<PresignedUrlResponse> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        ContentType: mimeType,
        ...(fileSize ? { ContentLength: fileSize } : {}),
      });

      const uploadUrl = await getSignedUrl(this.client, command, {
        expiresIn: expiresInSeconds,
      });

      this.logger.log({
        event: 'presigned_url_generated',
        fileKey,
        mimeType,
        expiresInSeconds,
        fileSize,
      });

      return {
        uploadUrl,
        publicUrl: `${this.publicDomain}/${fileKey}`,
        fileKey,
      };
    } catch (error) {
      this.logger.error({
        event: 'presigned_url_failed',
        fileKey,
        mimeType,
        reason: error instanceof Error ? error.message : String(error),
      });

      throw new InfrastructureException(
        'Failed to generate upload URL',
        MediaErrorCode.PRESIGNED_URL_FAILED,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });
      await this.client.send(command);
    } catch (error) {
      this.logger.error({
        event: 'file_deletion_failed',
        fileKey,
        reason: error instanceof Error ? error.message : String(error),
      });

      throw new InfrastructureException(
        'Failed to delete file',
        MediaErrorCode.INVALID_FILE_NAME,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
