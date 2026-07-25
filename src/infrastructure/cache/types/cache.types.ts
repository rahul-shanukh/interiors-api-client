//Backend\interiors-api-client\src\infrastructure\cache\types\cache.types.ts

export type CacheProvider = "redis" | "upstash";

export type CacheKey = string;

export type CacheTTL = number;

export type CacheValue = string | number | boolean | object | null;
