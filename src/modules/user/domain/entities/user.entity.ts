// src/modules/user/domain/entities/user.entity.ts

import { UserId } from "../../value-objects/user-id.vo";
import { Username } from "../../value-objects/username.vo";

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  LOCKED = "LOCKED",
}

type UserProps = {
  id: UserId;
  username: Username;
  email?: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  whatsappUpdates: boolean;
  status: UserStatus;
  createdAt: Date;
  lastLoginAt?: Date;
};

type UserChanges = Partial<
  Pick<
    UserProps,
    | "email"
    | "emailVerified"
    | "phone"
    | "phoneVerified"
    | "whatsappUpdates"
    | "status"
    | "lastLoginAt"
  >
>;

export class User {
  private constructor(private readonly props: Readonly<UserProps>) {}

  static create(input: {
    firebaseUid: string;
    username: string;
    email?: string;
    emailVerified: boolean;
    phone?: string;
    phoneVerified: boolean;
    whatsappUpdates: boolean;
  }): User {
    const email = input.email?.trim().toLowerCase() || undefined;
    const phone = input.phone?.trim() || undefined;

    User.validateContacts({
      email,
      emailVerified: input.emailVerified,
      phone,
      phoneVerified: input.phoneVerified,
    });

    return new User({
      id: UserId.create(input.firebaseUid),
      username: Username.create(input.username),
      email,
      emailVerified: input.emailVerified,
      phone,
      phoneVerified: input.phoneVerified,
      whatsappUpdates: input.whatsappUpdates,
      status: UserStatus.ACTIVE,
      createdAt: new Date(),
    });
  }

  static fromPersistence(input: {
    id: string;
    username: string;
    email?: string;
    emailVerified: boolean;
    phone?: string;
    phoneVerified: boolean;
    whatsappUpdates: boolean;
    status: UserStatus;
    createdAt: Date;
    lastLoginAt?: Date;
  }): User {
    User.validateContacts(input);

    return new User({
      id: UserId.create(input.id),
      username: Username.create(input.username),
      email: input.email,
      emailVerified: input.emailVerified,
      phone: input.phone,
      phoneVerified: input.phoneVerified,
      whatsappUpdates: input.whatsappUpdates,
      status: input.status,
      createdAt: input.createdAt,
      lastLoginAt: input.lastLoginAt,
    });
  }

  get id(): UserId {
    return this.props.id;
  }

  get username(): Username {
    return this.props.username;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get emailVerified(): boolean {
    return this.props.emailVerified;
  }

  get phone(): string | undefined {
    return this.props.phone;
  }

  get phoneVerified(): boolean {
    return this.props.phoneVerified;
  }

  get whatsappUpdates(): boolean {
    return this.props.whatsappUpdates;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastLoginAt(): Date | undefined {
    return this.props.lastLoginAt;
  }

  withVerifiedEmail(email: string): User {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error("Email address is required");
    }

    return this.copy({
      email: normalizedEmail,
      emailVerified: true,
    });
  }

  withVerifiedPhone(phone: string): User {
    const normalizedPhone = phone.trim();

    if (!normalizedPhone) {
      throw new Error("Phone number is required");
    }

    return this.copy({
      phone: normalizedPhone,
      phoneVerified: true,
    });
  }

  updateLastLogin(): User {
    return this.copy({ lastLoginAt: new Date() });
  }

  canLogin(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  suspend(): User {
    return this.copy({ status: UserStatus.SUSPENDED });
  }

  private copy(changes: UserChanges): User {
    return new User({
      ...this.props,
      ...changes,
    });
  }

  private static validateContacts(input: {
    email?: string;
    emailVerified: boolean;
    phone?: string;
    phoneVerified: boolean;
  }): void {
    if (input.emailVerified && !input.email) {
      throw new Error("A verified email address is required");
    }

    if (input.phoneVerified && !input.phone) {
      throw new Error("A verified phone number is required");
    }

    if (!input.emailVerified && !input.phoneVerified) {
      throw new Error("At least one contact method must be verified");
    }
  }
}
