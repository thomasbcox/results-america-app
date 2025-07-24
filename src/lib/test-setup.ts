// Global test setup with dependency-based database management
import { jest } from '@jest/globals';
import { createTestDatabase } from './testUtils';

// Create mock functions with proper typing
const mockHash = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<string>>;
const mockCompare = jest.fn() as jest.MockedFunction<(...args: any[]) => Promise<boolean>>;
const mockRandomBytes = jest.fn(() => ({
  toString: () => 'mock-token-1234567890abcdef',
})) as jest.MockedFunction<(...args: any[]) => { toString: () => string }>;

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

/**
 * GLOBAL TEST SETUP WITH DEPENDENCY-BASED DATABASE MANAGEMENT
 * 
 * This setup ensures all tests follow the proper dependency order:
 * 1. Clear data in reverse dependency order
 * 2. Populate foundation data in dependency order
 * 3. Run test
 * 4. Clean up in reverse dependency order
 */

// Global test utilities with dependency management
export const setupAuthTest = () => {
  let testDb: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockHash.mockResolvedValue('hashed-password-123');
    mockCompare.mockResolvedValue(true);
    mockRandomBytes.mockReturnValue({
      toString: () => 'mock-token-1234567890abcdef',
    });

    // Setup test database with proper dependency order
    const testDatabase = createTestDatabase();
    testDb = testDatabase.db;
    
    // Clear any existing data in reverse dependency order
    await testDatabase.clearAllData();
    
    // Populate foundation data in dependency order
    await testDatabase.populateFoundationData();
  });

  afterEach(async () => {
    // Clean up in reverse dependency order
    if (testDb) {
      const testDatabase = createTestDatabase();
      await testDatabase.clearAllData();
    }
  });

  return { mockHash, mockCompare, mockRandomBytes, testDb };
};

// Enhanced test data factories with unique identifiers
export const createTestUserData = (overrides: Record<string, any> = {}) => ({
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  name: 'Test User',
  password: 'password123',
  role: 'user' as const,
  ...overrides,
});

export const createTestAdminData = (overrides: Record<string, any> = {}) => ({
  email: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  name: 'Admin User',
  password: 'admin123',
  role: 'admin' as const,
  ...overrides,
});

/**
 * DEPENDENCY-BASED DATABASE CLEANUP
 * 
 * IMPORTANT: Always clear tables in REVERSE dependency order to avoid foreign key violations
 */
export const cleanupDatabase = async (db: any) => {
  const { 
    dataPoints,
    sessions, 
    passwordResetTokens, 
    userActivityLogs,
    statistics,
    importSessions,
    users,
    states,
    categories,
    dataSources
  } = await import('./db/schema');
  
  // GROUP 3: Second-Level Dependencies (clear first)
  await db.delete(dataPoints);
  
  // GROUP 2: First-Level Dependencies
  await db.delete(sessions);
  await db.delete(passwordResetTokens);
  await db.delete(userActivityLogs);
  await db.delete(statistics);
  await db.delete(importSessions);
  
  // GROUP 1: Foundation Tables (clear last)
  await db.delete(users);
  await db.delete(states);
  await db.delete(categories);
  await db.delete(dataSources);
};

/**
 * DEPENDENCY-BASED DATABASE POPULATION
 * 
 * IMPORTANT: Always populate tables in dependency order to avoid foreign key violations
 */
export const populateDatabase = async (db: any) => {
  const testDatabase = createTestDatabase();
  await testDatabase.populateFoundationData();
}; 