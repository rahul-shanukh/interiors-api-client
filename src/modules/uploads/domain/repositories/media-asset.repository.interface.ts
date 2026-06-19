//src/modules/uploads/domain/repositories/media-asset.repository.interface.ts

import { MediaAsset } from '../entities/media-asset.entity';

export interface IMediaAssetRepository {
  create(asset: MediaAsset): Promise<MediaAsset>;
  findByFileKey(fileKey: string): Promise<MediaAsset | null>;
  updateStatus(
    fileKey: string,
    status: 'pending' | 'confirmed' | 'failed',
  ): Promise<MediaAsset | null>;
}

export const MEDIA_ASSET_REPOSITORY = 'MEDIA_ASSET_REPOSITORY';
