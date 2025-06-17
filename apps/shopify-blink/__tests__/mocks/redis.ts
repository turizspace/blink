import { jest } from '@jest/globals';
import type { Redis, RedisKey, Callback } from 'ioredis';

type MockRedis = Partial<Redis>;

export const createMockRedis = (): MockRedis => {
  const mockRedis: MockRedis = {};

  const mockSet = jest.fn(
    async (key: RedisKey, value: string | number | Buffer, ...args: any[]): Promise<'OK'> => {
      const callback = args[args.length - 1];
      if (typeof callback === 'function') {
        callback(null, 'OK');
      }
      return 'OK';
    }
  );

  mockRedis.set = mockSet;

  // Add other Redis methods as needed
  // For example, you can add a mock for get, del, etc.

  return mockRedis;
}
