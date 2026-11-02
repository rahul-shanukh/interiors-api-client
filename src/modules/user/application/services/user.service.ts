// src/modules/user/application/services/user.service.ts

import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { UserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { DomainException } from "src/common/exceptions/domain.exception";
import { UserErrorCode } from "src/common/constants/error-codes.generated";

type RegisterUserInput = {
  firebaseUid: string;
  username: string;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  whatsappUpdates: boolean;
};

@Injectable()
export class UserService {
  constructor(
    @Inject("UserRepository")
    private readonly userRepository: UserRepository,
  ) {}

  async createProfile(input: RegisterUserInput): Promise<User> {
    const existingUser = await this.userRepository.findByUserId(
      input.firebaseUid,
    );

    if (existingUser) {
      throw new DomainException(
        "This account is already registered.",
        UserErrorCode.ACCOUNT_ALREADY_EXISTS,
      );
    }

    const username = input.username.trim();
    const userWithUsername = await this.userRepository.findByUsername(username);

    if (userWithUsername) {
      throw new DomainException(
        "This username is already taken.",
        UserErrorCode.USERNAME_TAKEN,
      );
    }

    const user = User.create({
      firebaseUid: input.firebaseUid,
      username,
      email: input.email,
      emailVerified: input.emailVerified,
      phone: input.phone,
      phoneVerified: input.phoneVerified,
      whatsappUpdates: input.whatsappUpdates,
    });

    try {
      return await this.userRepository.create(user);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === 11000
      ) {
        throw new ConflictException(
          "This username or verified contact is already in use.",
        );
      }

      throw error;
    }
  }

  async findByUserId(userId: string): Promise<User | null> {
    return this.userRepository.findByUserId(userId);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findByUsername(username);
  }

  async updateLastLogin(user: User): Promise<void> {
    await this.userRepository.updateLastLogin(user.id.getValue(), new Date());
  }
}
