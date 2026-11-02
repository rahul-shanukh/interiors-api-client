// src/modules/auth/auth.module.ts

import { Module } from "@nestjs/common";
import { AuthService } from "./application/services/auth.service";
import { UserModule } from "../user/user.module";
import { FirebaseAdminModule } from "src/infrastructure/firebase/firebase-admin.module";
import { AuthController } from "./controllers/auth.controller";

@Module({
  imports: [UserModule, FirebaseAdminModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
