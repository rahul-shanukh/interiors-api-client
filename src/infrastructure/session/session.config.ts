// Backend\interiors-api-client\src\infrastructure\session\session.config.ts

import session, { SessionData } from "express-session";
import { CacheService } from "../cache/cache.service";
// import { RequestHandler } from "express";
import type { RequestHandler } from "express-serve-static-core";
/**
 * A custom, polymorphic session store that delegates all operations
 * to the globally configured CacheService (Redis or Upstash).
 */
export class CacheSessionStore extends session.Store {
  constructor(
    private readonly cacheService: CacheService,
    private readonly prefix: string = "sess:",
  ) {
    super();
  }

  async get(
    sid: string,
    callback: (err: any, session?: SessionData | null) => void,
  ) {
    try {
      const session = await this.cacheService.get<SessionData>(
        this.prefix + sid,
      );
      // express-session expects null if the session is not found
      callback(null, session ?? null);
    } catch (error) {
      callback(error);
    }
  }

  async set(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: any) => void,
  ) {
    try {
      // express-session originalMaxAge is in milliseconds; the cache layer expects seconds
      const ttl = sessionData.cookie.originalMaxAge
        ? Math.floor(sessionData.cookie.originalMaxAge / 1000)
        : 28800; // 8 hours default

      await this.cacheService.set(this.prefix + sid, sessionData, ttl);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      await this.cacheService.delete(this.prefix + sid);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }

  async touch(
    sid: string,
    sessionData: SessionData,
    callback?: (err?: any) => void,
  ) {
    try {
      // Refreshes the TTL on the active session so users aren't logged out while active
      const ttl = sessionData.cookie.originalMaxAge
        ? Math.floor(sessionData.cookie.originalMaxAge / 1000)
        : 28800;

      await this.cacheService.set(this.prefix + sid, sessionData, ttl);
      callback?.(null);
    } catch (error) {
      callback?.(error);
    }
  }
}

export function createSession(cacheService: CacheService): RequestHandler {
  return session({
    store: new CacheSessionStore(cacheService),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8 Hours
    },
  });
}
