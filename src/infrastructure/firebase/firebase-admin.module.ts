// src/infrastructure/firebase/firebase-admin.module.ts

import { Module } from "@nestjs/common";
import {
  FIREBASE_ADMIN_AUTH,
  firebaseAdminAuthProvider,
} from "./firebase-admin.provider";

@Module({
  providers: [firebaseAdminAuthProvider],
  exports: [FIREBASE_ADMIN_AUTH],
})
export class FirebaseAdminModule {}
