import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Mock bcrypt for authentication tests
export const mockBcrypt = () => {
  const mockHash = jest.fn();
  const mockCompare = jest.fn();

  jest.mock('bcryptjs', () => ({
    default: {
      hash: mockHash,
      compare: mockCompare,
    },
  }));

  return {
    mockHash,
    mockCompare,
    bcrypt: bcrypt as jest.Mocked<typeof bcrypt>,
  };
};

// Mock crypto for token generation
export const mockCrypto = () => {
  const mockRandomBytes = jest.fn(() => ({
    toString: () => 'mock-token-1234567890abcdef',
  }));

  jest.mock('crypto', () => ({
    randomBytes: mockRandomBytes,
  }));

  return {
    mockRandomBytes,
    crypto: crypto as jest.Mocked<typeof crypto>,
  };
};

// Setup authentication test environment
export const setupAuthTest = () => {
  const bcryptMocks = mockBcrypt();
  const cryptoMocks = mockCrypto();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  return {
    ...bcryptMocks,
    ...cryptoMocks,
  };
};

// Common test data for authentication
export const createTestUserData = (overrides: Record<string, any> = {}) => ({
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  password: 'password123',
  role: 'user' as const,
  ...overrides,
});

export const createTestAdminData = (overrides: Record<string, any> = {}) => ({
  email: `admin-${Date.now()}@example.com`,
  name: 'Admin User',
  password: 'admin123',
  role: 'admin' as const,
  ...overrides,
});

// Test session data
export const createTestSessionData = (userId: number) => ({
  userId,
  token: 'test-session-token-1234567890abcdef',
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
});

// Test password reset token data
export const createTestPasswordResetData = (userId: number) => ({
  userId,
  token: 'test-reset-token-1234567890abcdef',
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
}); 