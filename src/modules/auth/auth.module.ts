// src/modules/auth/auth.module.ts

import { Module } from "@nestjs/common";
import { AuthService } from "./application/services/auth.service";
import { UserModule } from "../user/user.module";

@Module({
  imports: [
    UserModule, // Import UserModule to access UserService
  ],
  providers: [AuthService],
})
export class AuthModule {}
