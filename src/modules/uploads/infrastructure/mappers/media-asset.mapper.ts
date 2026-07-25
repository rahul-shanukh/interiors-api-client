// media-asset.mapper.ts

import {
  MediaAsset,
  AssetFolder,
  AssetStatus,
  Provider,
} from 'src/modules/uploads/domain/entities/media-asset.entity';
import { MediaAssetDocument } from '../persistence/mongo/schema/media-asset.schema';

export class MediaAssetMapper {
  static toDomain(doc: MediaAssetDocument): MediaAsset {
    return new MediaAsset({
      publicUrl: doc.publicUrl,
      fileKey: doc.fileKey,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      category: doc.category,
      provider: doc.provider as unknown as Provider,
      folder: doc.folder as unknown as AssetFolder,
      status: doc.status as unknown as AssetStatus,
      uploadedBy: {
        adminId: doc.uploadedBy.adminId,
        adminName: doc.uploadedBy.name,
      },
      createdAt: (doc as any).createdAt,
      updatedAt: (doc as any).updatedAt,
    });
  }

  static toPersistence(asset: MediaAsset) {
    return asset.getProps();
  }
}
