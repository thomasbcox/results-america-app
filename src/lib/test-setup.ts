// Global test setup for authentication tests
import { jest } from '@jest/globals';

// Create mock functions
const mockHash = jest.fn();
const mockCompare = jest.fn();
const mockRandomBytes = jest.fn(() => ({
  toString: () => 'mock-token-1234567890abcdef',
}));

// Mock bcrypt globally - this needs to be hoisted
jest.mock('bcryptjs', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare,
  },
}));

// Mock crypto globally - this needs to be hoisted
jest.mock('crypto', () => ({
  randomBytes: mockRandomBytes,
}));

// Export mocks for use in tests
export { mockHash, mockCompare, mockRandomBytes };

// Global test utilities
export const setupAuthTest = () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockHash.mockResolvedValue('hashed-password-123');
    mockCompare.mockResolvedValue(true);
    mockRandomBytes.mockReturnValue({
      toString: () => 'mock-token-1234567890abcdef',
    });
  });

  return { mockHash, mockCompare, mockRandomBytes };
};

// Test data factories
export const createTestUserData = (overrides: any = {}) => ({
  email: `test-${Date.now()}@example.com`,
  name: 'Test User',
  password: 'password123',
  role: 'user' as const,
  ...overrides,
});

export const createTestAdminData = (overrides: any = {}) => ({
  email: `admin-${Date.now()}@example.com`,
  name: 'Admin User',
  password: 'admin123',
  role: 'admin' as const,
  ...overrides,
});

// Database cleanup utilities
export const cleanupDatabase = async (db: any) => {
  const { userActivityLogs, passwordResetTokens, sessions, users } = await import('./db/schema');
  
  await db.delete(userActivityLogs);
  await db.delete(passwordResetTokens);
  await db.delete(sessions);
  await db.delete(users);
}; 