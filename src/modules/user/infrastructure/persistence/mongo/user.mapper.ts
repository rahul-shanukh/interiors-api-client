// src/modules/user/infrastructure/persistence/mongo/user.mapper.ts

import { User } from "../../../domain/entities/user.entity";
import type { UserDocument, UserHydratedDocument } from "./user.schema";

type UserPersistence = Pick<
  UserDocument,
  | "userId"
  | "username"
  | "email"
  | "emailVerified"
  | "phone"
  | "phoneVerified"
  | "whatsappUpdates"
  | "status"
  | "lastLoginAt"
>;

export class UserMapper {
  static toDomain(raw: UserHydratedDocument): User {
    return User.fromPersistence({
      id: raw.userId,
      username: raw.username,
      email: raw.email,
      emailVerified: raw.emailVerified,
      phone: raw.phone,
      phoneVerified: raw.phoneVerified,
      whatsappUpdates: raw.whatsappUpdates,
      status: raw.status,
      createdAt: raw.createdAt,
      lastLoginAt: raw.lastLoginAt,
    });
  }

  static toPersistence(user: User): UserPersistence {
    return {
      userId: user.id.getValue(),
      username: user.username.getValue(),
      email: user.email,
      emailVerified: user.emailVerified,
      phone: user.phone,
      phoneVerified: user.phoneVerified,
      whatsappUpdates: user.whatsappUpdates,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
