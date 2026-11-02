// src/infrastructure/firebase/firebase-admin.provider.ts

import type { FactoryProvider } from "@nestjs/common";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

export const FIREBASE_ADMIN_AUTH = "FirebaseAdminAuth";

const APP_NAME = "interiors-client-api";

export const firebaseAdminAuthProvider: FactoryProvider<Auth> = {
  provide: FIREBASE_ADMIN_AUTH,

  useFactory: (): Auth => {
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (!projectId) {
      throw new Error("FIREBASE_PROJECT_ID is required");
    }

    const app =
      getApps().find((existingApp) => existingApp.name === APP_NAME) ??
      initializeApp(
        {
          credential: applicationDefault(),
          projectId,
        },
        APP_NAME,
      );

    return getAuth(app);
  },
};
