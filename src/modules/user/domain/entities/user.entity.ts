// src/modules/user/domain/entities/user.entity.ts

import { UserId } from '../../value-objects/user-id.vo';
import { Username } from '../../value-objects/username.vo';
import { Password } from '../../value-objects/password.vo';

export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  LOCKED = 'LOCKED',
}

export class User {
  private constructor(
    public readonly id: UserId,
    public readonly username: Username,
    public readonly password: Password,
    public readonly employeeId: string,
    public readonly status: UserStatus,
    public readonly createdAt: Date,
    public readonly lastLoginAt?: Date,
  ) {}

  // Factory method for creating a new user during activation
  // Now username defaults to employee ID for simplicity
  static async create(props: {
    plainPassword: string;
    employeeId: string;
  }): Promise<User> {
    const userId = UserId.create(crypto.randomUUID());
    // Use the employee ID as the username - this keeps things simple and intuitive
    const username = Username.create(props.employeeId);
    const password = await Password.create(props.plainPassword);

    return new User(
      userId,
      username,
      password,
      props.employeeId,
      UserStatus.ACTIVE,
      new Date(),
    );
  }

  static fromPersistence(props: {
    id: string;
    username: string;
    hashedPassword: string;
    employeeId: string;
    status: UserStatus;
    createdAt: Date;
    lastLoginAt?: Date;
  }): User {
    return new User(
      UserId.create(props.id),
      Username.create(props.username),
      Password.fromHash(props.hashedPassword),
      props.employeeId,
      props.status,
      props.createdAt,
      props.lastLoginAt,
    );
  }

  async verifyPassword(plainPassword: string): Promise<boolean> {
    return this.password.verify(plainPassword);
  }

  updateLastLogin(): User {
    return new User(
      this.id,
      this.username,
      this.password,
      this.employeeId,
      this.status,
      this.createdAt,
      new Date(),
    );
  }

  canLogin(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  suspend(): User {
    return new User(
      this.id,
      this.username,
      this.password,
      this.employeeId,
      UserStatus.SUSPENDED,
      this.createdAt,
      this.lastLoginAt,
    );
  }
}
