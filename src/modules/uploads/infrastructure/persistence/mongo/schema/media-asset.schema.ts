// src/modules/uploads/infrastructure/persistence/mongo/media-asset.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import type {
  AssetFolder,
  Provider,
} from 'src/modules/uploads/domain/entities/media-asset.entity';

export type MediaAssetDocument = MediaAsset & Document;

@Schema({ timestamps: true })
export class MediaAsset {
  @Prop({ required: true }) publicUrl!: string;
  @Prop({ required: true }) fileKey!: string;
  @Prop({ required: true }) fileName!: string;
  @Prop({ required: true }) mimeType!: string;
  @Prop({ required: true }) fileSize!: number;
  @Prop({ required: true }) category!: string;
  @Prop({ required: true, enum: ['r2', 's3', 'gcs'] })
  provider!: Provider;
  @Prop({ required: true, enum: ['catalog', 'project'] })
  folder!: AssetFolder;

  @Prop({
    type: {
      adminId: { type: String, required: true },
      adminName: { type: String, required: true }, // ← was 'name', fix to 'adminName'
    },
    required: true,
    _id: false,
  })
  uploadedBy!: { adminId: string; name: string };

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'failed'],
    default: 'pending',
  })
  status!: string;
}

export const MediaAssetSchema = SchemaFactory.createForClass(MediaAsset);
