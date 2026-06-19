// src/modules/uploads/infrastructure/persistence/mongo/repo/media-asset.mongo.repository.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MediaAsset } from 'src/modules/uploads/domain/entities/media-asset.entity';
import { IMediaAssetRepository } from 'src/modules/uploads/domain/repositories/media-asset.repository.interface';
import {
  MediaAssetDocument,
  MediaAsset as MediaAssetSchema,
} from '../schema/media-asset.schema';
import { MediaAssetMapper } from '../../../mappers/media-asset.mapper';

@Injectable()
export class MediaAssetMongoRepository implements IMediaAssetRepository {
  constructor(
    @InjectModel(MediaAssetSchema.name)
    private readonly model: Model<MediaAssetDocument>,
  ) {}

  async create(asset: MediaAsset): Promise<MediaAsset> {
    const doc = await this.model.create(MediaAssetMapper.toPersistence(asset));
    return MediaAssetMapper.toDomain(doc);
  }

  async findByFileKey(fileKey: string): Promise<MediaAsset | null> {
    const doc = await this.model.findOne({ fileKey }).exec();
    return doc ? MediaAssetMapper.toDomain(doc) : null;
  }

  async updateStatus(
    fileKey: string,
    status: 'pending' | 'confirmed' | 'failed',
  ): Promise<MediaAsset | null> {
    const doc = await this.model
      .findOneAndUpdate({ fileKey }, { status }, { new: true })
      .exec();
    return doc ? MediaAssetMapper.toDomain(doc) : null;
  }
}
