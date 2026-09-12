import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { User } from "../../../domain/entities/user.entity";
import { UserDocument } from "./user.schema";
import { UserMapper } from "./user.mapper";

// MongoDB implementation of the UserRepository interface
// This handles all the transformation between domain entities and MongoDB documents
@Injectable()
export class UserMongoRepository implements UserRepository {
  constructor(
    @InjectModel(UserDocument.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async deleteByUserId(employeeId: string): Promise<boolean> {
    const result = await this.userModel.deleteOne({ employeeId }).exec();
    return result.deletedCount > 0;
  }

  async save(user: User): Promise<User> {
    const userDoc = new this.userModel(UserMapper.toPersistence(user));
    const saved = await userDoc.save();
    return UserMapper.toDomain(saved);
  }

  async findByUsername(username: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ username }).exec();

    if (!userDoc) {
      return null;
    }

    return UserMapper.toDomain(userDoc);
  }

  async findByEmployeeId(employeeId: string): Promise<User | null> {
    const userDoc = await this.userModel.findOne({ employeeId }).exec();

    if (!userDoc) {
      return null;
    }

    return UserMapper.toDomain(userDoc);
  }

  async existsByEmployeeId(employeeId: string): Promise<boolean> {
    const count = await this.userModel.countDocuments({ employeeId }).exec();
    return count > 0;
  }

  async updateLastLogin(userId: string, lastLogin: Date): Promise<void> {
    await this.userModel.updateOne({ userId }, { $set: { lastLogin } });
  }
}
