// src/infrastructure/storage/interface/storage.interface.ts

export const I_STORAGE_PROVIDER = Symbol('I_STORAGE_PROVIDER');

export interface PresignedUrlResponse {
  uploadUrl: string;
  publicUrl: string;
  fileKey: string;
}

export interface IStorageProvider {
  generatePresignedUrl(
    fileKey: string,
    mimeType: string,
    expireInSeconds?: number,
    fileSize?: number, // ← add this for ContentLength enforcement
  ): Promise<PresignedUrlResponse>;
}
