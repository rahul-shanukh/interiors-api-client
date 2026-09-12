// src/infrastructure/storage/storage.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageFactory } from '../factory/storage.factory';
import { CloudflareR2Adapter } from '../adapters/cloudflare-r2.adapter';
import { GcpStorageAdapter } from '../adapters/gcp-storage.adapter';

@Module({
  imports: [ConfigModule],
  providers: [StorageFactory, CloudflareR2Adapter, GcpStorageAdapter],
  // 👉 We export ONLY the factory. The rest of the app doesn't need to see the adapters.
  exports: [StorageFactory],
})
export class StorageModule {}
