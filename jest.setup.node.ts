import '@testing-library/jest-dom';

// Node.js specific test setup for contract/integration tests
// This file is used for tests that run in Node environment

// Mock environment variables for testing
(process.env as any).NODE_ENV = 'test';
(process.env as any).NEXT_PUBLIC_API_PATH = 'http://localhost:3001/api';
(process.env as any).NEXTAUTH_URL = 'http://localhost:3001';
(process.env as any).NEXTAUTH_SECRET = 'test-secret';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Mock timers for performance testing
beforeEach(() => {
  jest.clearAllMocks();
  jest.clearAllTimers();
});

// Global test timeout for async operations
jest.setTimeout(30000); // 30 seconds for contract tests that may involve network calls

// Mock fetch for API testing
global.fetch = jest.fn();

// Setup global test utilities
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;