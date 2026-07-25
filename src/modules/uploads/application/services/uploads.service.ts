// src/modules/uploads/application/services/uploads.service.ts

import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import {
  StorageFactory,
  SupportedProvider,
} from "src/infrastructure/storage/factory/storage.factory";
import type { PresignedUrlResponse } from "src/infrastructure/storage/interface/storage.interface";
// import { ALLOWED_MIME_TYPES } from 'src/shared/constants/media.constants';
import { InfrastructureException } from "src/common/exceptions/infrastructure.exception";
import { DomainException } from "src/common/exceptions/domain.exception";
import { MediaErrorCode } from "src/common/constants/error-codes.generated";
import {
  MediaAsset,
  UploadedBy,
} from "src/modules/uploads/domain/entities/media-asset.entity";
import type { IMediaAssetRepository } from "src/modules/uploads/domain/repositories/media-asset.repository.interface";
import { MEDIA_ASSET_REPOSITORY } from "src/modules/uploads/domain/repositories/media-asset.repository.interface";
import { FileItemDto } from "../dto/generate-url.dto";

@Injectable()
export class UploadsService {
  constructor(
    private readonly storageFactory: StorageFactory,
    @Inject(MEDIA_ASSET_REPOSITORY)
    private readonly mediaAssetRepository: IMediaAssetRepository,
  ) {}

  async generateUploadUrl(
    files: FileItemDto[],
    providerType: SupportedProvider,
    uploadedBy: UploadedBy,
  ): Promise<PresignedUrlResponse[]> {
    const storageEngine = this.storageFactory.getProvider(providerType);
    const results: PresignedUrlResponse[] = [];

    for (const file of files) {
      const [baseType, extension] = file.mimeType.split("/");

      const folderType =
        baseType === "image"
          ? "images"
          : baseType === "video"
            ? "videos"
            : "documents";

      const fileKey = `catalog/${folderType}/${file.category}/${uuidv4()}-${extension}`;

      let result: PresignedUrlResponse;

      try {
        result = await storageEngine.generatePresignedUrl(
          fileKey,
          file.mimeType,
          60,
          file.fileSize,
        );
      } catch (error: any) {
        throw new InfrastructureException(
          `Failed to generate presigned URL for ${file.fileName}`,
          MediaErrorCode.PRESIGNED_URL_FAILED,
          HttpStatus.INTERNAL_SERVER_ERROR,
          error.message,
        );
      }

      // ✅ create pending record
      // it is for DB consistency to ensure that we have a record of the upload attempt,
      // even if the client fails to confirm it later.
      const asset = MediaAsset.createPending({
        publicUrl: result.publicUrl,
        fileKey,
        fileName: file.fileName,
        mimeType: file.mimeType,
        fileSize: file.fileSize,
        category: file.category,
        folder: "catalog",
        provider: providerType,
        uploadedBy,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await this.mediaAssetRepository.create(asset);

      results.push(result);
    }
    return results;
  }

  // add this method to existing UploadsService

  async confirmUpload(fileKey: string): Promise<MediaAsset> {
    const asset = await this.mediaAssetRepository.findByFileKey(fileKey);

    if (!asset) {
      throw new DomainException(
        "Media asset not found",
        MediaErrorCode.ASSET_NOT_FOUND,
      );
    }

    if (asset.getProps().status === "confirmed") {
      throw new DomainException(
        "Media asset already confirmed",
        MediaErrorCode.ASSET_ALREADY_CONFIRMED,
      );
    }

    const confirmed = await this.mediaAssetRepository.updateStatus(
      fileKey,
      "confirmed",
    );

    return confirmed!;
  }
}
