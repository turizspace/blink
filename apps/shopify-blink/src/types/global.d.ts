import type { Redis as RedisClient } from 'ioredis';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      redis: RedisClient;
    }
  }
}
