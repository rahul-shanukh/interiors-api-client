// src/infrastructure/storage/adapters/gcp-storage.adapter.ts

import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ConfigService } from '@nestjs/config';
import {
  IStorageProvider,
  PresignedUrlResponse,
} from '../interface/storage.interface';
import { InfrastructureException } from 'src/common/exceptions/infrastructure.exception';
import { MediaErrorCode } from 'src/common/constants/error-codes.generated';

@Injectable()
export class GcpStorageAdapter implements IStorageProvider {
  private readonly logger = new Logger(GcpStorageAdapter.name);
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly publicDomain: string;

  constructor(private readonly configService: ConfigService) {
    const projectId = this.configService.getOrThrow<string>('GCS_PROJECT_ID');
    const clientEmail =
      this.configService.getOrThrow<string>('GCS_CLIENT_EMAIL');

    // 🔥 Pro-Tip: GCP private keys in .env files often break because of literal '\n' characters.
    // This replace() ensures the key is parsed correctly regardless of how it's injected.
    const privateKey = this.configService
      .getOrThrow<string>('GCS_PRIVATE_KEY')
      .replace(/\\n/g, '\n');

    this.bucketName = this.configService.getOrThrow<string>('GCS_BUCKET_NAME');

    // GCP buckets have a default public URL, but allowing a custom domain keeps parity with R2
    this.publicDomain = this.configService.get<string>(
      'GCS_PUBLIC_DOMAIN',
      `https://storage.googleapis.com/${this.bucketName}`,
    );

    this.storage = new Storage({
      projectId,
      credentials: {
        client_email: clientEmail,
        private_key: privateKey,
      },
      // You can also add retry options here similar to the S3 timeouts
      retryOptions: {
        autoRetry: true,
        maxRetries: 3,
      },
    });
  }

  async generatePresignedUrl(
    fileKey: string,
    mimeType: string,
    expiresInSeconds = 300,
  ): Promise<PresignedUrlResponse> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileKey);

      // GCP expects the expiration as a future timestamp (Date.now() + ms)
      const expiresAt = Date.now() + expiresInSeconds * 1000;

      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: expiresAt,
        contentType: mimeType,
      });

      this.logger.log({
        event: 'presigned_url_generated',
        provider: 'gcp',
        fileKey,
        mimeType,
        expiresInSeconds,
      });

      // Handle custom domains vs default GCP storage domains smoothly
      const publicUrl = this.publicDomain.includes('storage.googleapis.com')
        ? `${this.publicDomain}/${fileKey}`
        : `${this.publicDomain}/${fileKey}`;

      return {
        uploadUrl,
        publicUrl,
        fileKey,
      };
    } catch (error) {
      this.logger.error({
        event: 'presigned_url_failed',
        provider: 'gcp',
        fileKey,
        mimeType,
        reason: error instanceof Error ? error.message : String(error),
      });

      throw new InfrastructureException(
        'Failed to generate GCP upload URL',
        MediaErrorCode.PRESIGNED_URL_FAILED, // Ensure you have this in your error-codes.generated.ts
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
