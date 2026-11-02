// src/modules/user/infrastructure/persistence/mongo/user.mongo.repository.ts

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model } from "mongoose";
import type { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { UserDocument } from "./user.schema";
import { UserMapper } from "./user.mapper";

@Injectable()
export class UserMongoRepository implements UserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(user: User): Promise<User> {
    const document = new this.userModel(UserMapper.toPersistence(user));
    const saved = await document.save();

    return UserMapper.toDomain(saved);
  }

  async update(user: User): Promise<User> {
    const data = UserMapper.toPersistence(user);

    const updated = await this.userModel
      .findOneAndUpdate(
        { userId: data.userId },
        {
          $set: {
            username: data.username,
            email: data.email,
            emailVerified: data.emailVerified,
            phone: data.phone,
            phoneVerified: data.phoneVerified,
            whatsappUpdates: data.whatsappUpdates,
            status: data.status,
            lastLoginAt: data.lastLoginAt,
          },
        },
        {
          new: true,
          runValidators: true,
          upsert: false,
        },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException("User not found");
    }

    return UserMapper.toDomain(updated);
  }

  async findByUserId(userId: string): Promise<User | null> {
    const document = await this.userModel.findOne({ userId }).exec();

    return document ? UserMapper.toDomain(document) : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const document = await this.userModel.findOne({ username }).exec();

    return document ? UserMapper.toDomain(document) : null;
  }

  async updateLastLogin(userId: string, lastLoginAt: Date): Promise<void> {
    await this.userModel
      .updateOne({ userId }, { $set: { lastLoginAt } })
      .exec();
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ userId }).exec();

    return result.deletedCount > 0;
  }
}
