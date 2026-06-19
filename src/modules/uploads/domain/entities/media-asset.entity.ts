//src/modules/uploads/domain/entities/media-asset.entity.ts

export type AssetFolder = 'catalog' | 'project';
export type AssetStatus = 'pending' | 'confirmed' | 'failed';
export type Provider = 'r2' | 's3' | 'gcs';

export interface UploadedBy {
  adminId: string;
  adminName: string;
}

export interface MediaAssetProps {
  publicUrl: string;
  fileKey: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  category: string;
  provider: Provider;
  folder: AssetFolder;
  uploadedBy: UploadedBy;
  createdAt: Date;
  updatedAt: Date;
  status: AssetStatus;
}

export class MediaAsset {
  constructor(public readonly props: MediaAssetProps) {}

  static createPending(props: Omit<MediaAssetProps, 'status'>): MediaAsset {
    return new MediaAsset({
      ...props,
      status: 'pending',
    });
  }

  confirm(): MediaAsset {
    return new MediaAsset({
      ...this.props,
      status: 'confirmed',
    });
  }

  fail(): MediaAsset {
    return new MediaAsset({
      ...this.props,
      status: 'failed',
    });
  }

  getProps(): Readonly<MediaAssetProps> {
    return Object.freeze({ ...this.props });
  }
}
