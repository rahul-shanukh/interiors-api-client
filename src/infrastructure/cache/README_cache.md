# Cache Architecture

## Implementation Order

```text
                 CacheService (uses interface)
                          │
                          ▼
                 ICacheStrategy
                  /          \
                 /            \
        UpstashStrategy   RedisStrategy
                 \            /
                  \          /
                CacheFactory
                      │
              CACHE_PROVIDER=upstash
                      │
               returns UpstashStrategy
```

After `ICacheStrategy`, the implementation order should be:

1. **ICacheStrategy** — Done
2. **UpstashStrategy** — Implements `ICacheStrategy`
3. **RedisStrategy** — Implements `ICacheStrategy`
4. **CacheFactory** — Returns the correct strategy based on `CACHE_PROVIDER`
5. **CacheService** — Uses the strategy returned by the factory
6. **CacheModule** — Registers everything with Nest DI
7. **Replace direct Redis usage** throughout the project with `CacheService`

This order keeps the design clean and follows the **Strategy + Factory pattern**.

---

## Cache Structure

```text
Cache
│
├── 1. Contract
│   └── ICacheStrategy
│
├── 2. Client Management
│   ├── RedisService
│   └── UpstashService
│
├── 3. Strategy Layer
│   ├── RedisStrategy
│   └── UpstashStrategy
│
├── 4. Factory Layer
│   └── CacheFactory
│
├── 5. Facade Layer
│   └── CacheService
│
├── 6. DI Layer
│   └── CacheModule
│
├── 7. Configuration
│   ├── cache.config.ts
│   ├── cache.constants.ts
│   └── cache.tokens.ts
│
├── 8. Cross-Cutting
│   ├── CacheInterceptor
│   ├── CacheKeyBuilder
│   ├── CacheSerializer
│   └── CacheMetrics
│
├── 9. Consumers
│   ├── Auth
│   ├── OTP
│   ├── Session
│   ├── Rate Limiting
│   └── Product/User modules
│
└── 10. Future Providers
    ├── ValkeyStrategy
    ├── MemcachedStrategy
    └── InMemoryStrategy
```
