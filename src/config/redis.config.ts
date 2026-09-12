//Backend\interiors-api-client\src\config\redis.config.ts

export default () => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});
