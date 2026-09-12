// src/infrastructure/cache/config/cache.config.ts

export const CACHE_CONFIG = {
  ttl: {
    default: 300, // 5 minutes
    short: 60, // 1 minute
    medium: 900, // 15 minutes
    long: 3600, // 1 hour
    veryLong: 86400, // 24 hours
  },
  retry: {
    attempts: 3,
    delay: 100,
  },
};

export const RATE_LIMIT_CONFIG = {
  quote: {
    ip: {
      maxRequests: 200,
      windowSeconds: 480, // ~8 minutes
    },
    email: {
      maxRequests: 10,
      windowSeconds: 600, // 10 min
    },
    phone: {
      maxRequests: 3,
      windowSeconds: 3600, // 1 hour
    },
    global: {
      maxRequests: 1000,
      windowSeconds: 60, // 1 minute
    },
  },
  // Future rate limiters can be added here:
  // upload: { ... },
  // auth: { ... },
};
