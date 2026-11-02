// src/modules/user/domain/repositories/user.repository.ts

import type { User } from "../entities/user.entity";

export interface UserRepository {
  create(user: User): Promise<User>;
  update(user: User): Promise<User>;
  findByUserId(userId: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  updateLastLogin(userId: string, lastLoginAt: Date): Promise<void>;
  deleteByUserId(userId: string): Promise<boolean>;
}
