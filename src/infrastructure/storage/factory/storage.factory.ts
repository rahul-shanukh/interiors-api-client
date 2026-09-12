// src/infrastructure/storage/factory/storage.factory.ts

import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { CloudflareR2Adapter } from '../adapters/cloudflare-r2.adapter';
import { GcpStorageAdapter } from '../adapters/gcp-storage.adapter';
import { IStorageProvider } from '../interface/storage.interface';
import { InfrastructureException } from 'src/common/exceptions/infrastructure.exception';
import { MediaErrorCode } from 'src/common/constants/error-codes.generated';

// Ensure this matches what the frontend is allowed to send
export type SupportedProvider = 'r2' | 'gcs';

@Injectable()
export class StorageFactory {
  private readonly logger = new Logger(StorageFactory.name);

  // Inject all available adapters into the factory
  constructor(
    private readonly r2Adapter: CloudflareR2Adapter,
    private readonly gcpAdapter: GcpStorageAdapter,
  ) {}

  /**
   * Returns the correct storage adapter based on the frontend's request.
   */
  getProvider(providerType: SupportedProvider): IStorageProvider {
    switch (providerType) {
      case 'r2':
        return this.r2Adapter;

      case 'gcs':
        return this.gcpAdapter;

      default:
        // Production Grade: Log the exact malicious or broken payload
        this.logger.error(
          `Frontend requested unknown storage provider: '${providerType}'`,
        );

        // No try/catch needed. We throw a BAD_REQUEST because the user sent bad data.
        throw new InfrastructureException(
          `Storage provider '${providerType}' is not supported. Please use 'r2' or 'gcp'.`,
          MediaErrorCode.STORAGE_PROVIDER_NOT_SUPPORTED,
          HttpStatus.BAD_REQUEST,
        );
    }
  }
}
