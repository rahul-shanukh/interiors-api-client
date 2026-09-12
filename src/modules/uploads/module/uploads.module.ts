// src/modules/uploads/uploads.module.ts

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { UploadsService } from "../application/services/uploads.service";
import { StorageModule } from "src/infrastructure/storage/module/storage.module";
import { UploadsController } from "../controllers/uploads.controller";
import {
  MediaAsset,
  MediaAssetSchema,
} from "../infrastructure/persistence/mongo/schema/media-asset.schema";
import { MediaAssetMongoRepository } from "../infrastructure/persistence/mongo/repo/media-asset.mongo.repository";
import { MEDIA_ASSET_REPOSITORY } from "../domain/repositories/media-asset.repository.interface";

@Module({
  imports: [
    ConfigModule,
    StorageModule,
    MongooseModule.forFeature([
      { name: MediaAsset.name, schema: MediaAssetSchema },
    ]),
  ],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    {
      provide: MEDIA_ASSET_REPOSITORY,
      useClass: MediaAssetMongoRepository,
    },
  ],
  exports: [UploadsService],
})
export class UploadsModule {}
