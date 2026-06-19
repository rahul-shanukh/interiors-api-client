import session from 'express-session';
import connectRedis from 'connect-redis';
import type Redis from 'ioredis';

export function createSession(redisClient: Redis) {
  const RedisStore = connectRedis(session); // This line creates the RedisStore class

  return session({
    store: new RedisStore({
      client: redisClient as any,
      prefix: 'sess:',
      ttl: 28800,
    }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  });
}
