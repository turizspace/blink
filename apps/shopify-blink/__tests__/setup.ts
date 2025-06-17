import { jest } from '@jest/globals';

// Setup global test environment
beforeAll(() => {
  // Setup fetch mock
  const mockFetch = jest.fn();
  global.fetch = mockFetch as unknown as typeof fetch;
});

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
