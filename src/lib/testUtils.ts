import { createTestDb } from './db/testDb';
import { users, sessions, passwordResetTokens, userActivityLogs } from './db/schema';

export interface TestDatabase {
  db: any;
  cleanup: () => Promise<void>;
}

export function createTestDatabase(): TestDatabase {
  const db = createTestDb();
  
  const cleanup = async () => {
    try {
      await db.delete(userActivityLogs);
      await db.delete(passwordResetTokens);
      await db.delete(sessions);
      await db.delete(users);
    } catch (error) {
      // Ignore cleanup errors
    }
  };

  return { db, cleanup };
}

// Test data factories
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

// Helper to create a test user in the database
export async function createTestUser(db: any, userData: any) {
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  
  const [user] = await db.insert(users).values({
    email: userData.email,
    name: userData.name,
    passwordHash: hashedPassword,
    role: userData.role,
    isActive: true,
    emailVerified: true,
  }).returning();
  
  return user;
} 