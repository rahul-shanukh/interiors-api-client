// src/modules/auth/application/services/auth.service.ts

import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import type { Auth, UserRecord } from "firebase-admin/auth";
import { UserService } from "src/modules/user/application/services/user.service";
import type { User } from "src/modules/user/domain/entities/user.entity";
import type { RegisterUserDto } from "src/modules/auth/application/dto/register-user.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,

    @Inject("FirebaseAdminAuth")
    private readonly firebaseAuth: Auth,
  ) {}

  async registerUser(idToken: string, input: RegisterUserDto): Promise<User> {
    const firebaseUser = await this.getFirebaseUser(idToken);

    const emailVerified = firebaseUser.emailVerified && !!firebaseUser.email;
    const phoneVerified = !!firebaseUser.phoneNumber;

    if (!emailVerified && !phoneVerified) {
      throw new UnauthorizedException(
        "Verify an email or phone number before registering",
      );
    }

    return this.userService.createProfile({
      firebaseUid: firebaseUser.uid,
      username: input.username,
      email: emailVerified ? firebaseUser.email : input.email,
      emailVerified,
      phone: firebaseUser.phoneNumber ?? input.phone,
      phoneVerified,
      whatsappUpdates: input.whatsappUpdates,
    });
  }

  async getCurrentUser(idToken: string): Promise<User> {
    const firebaseUser = await this.getFirebaseUser(idToken);

    const user = await this.userService.findByUserId(firebaseUser.uid);

    if (!user) {
      throw new NotFoundException(
        "Your profile was not found. Complete signup to continue.",
      );
    }

    if (!user.canLogin()) {
      throw new ForbiddenException(
        "Your account is not active. Please contact support.",
      );
    }

    return user;
  }

  private async getFirebaseUser(idToken: string): Promise<UserRecord> {
    if (!idToken) {
      throw new UnauthorizedException("Firebase ID token is required");
    }

    let firebaseUser: UserRecord;

    try {
      const decodedToken = await this.firebaseAuth.verifyIdToken(idToken);
      firebaseUser = await this.firebaseAuth.getUser(decodedToken.uid);
    } catch {
      throw new UnauthorizedException("Unable to verify Firebase account");
    }

    if (firebaseUser.disabled) {
      throw new UnauthorizedException("This account is disabled");
    }

    return firebaseUser;
  }
}
