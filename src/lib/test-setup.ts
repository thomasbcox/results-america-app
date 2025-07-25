import { createTestDatabase, TestDatabase } from './testUtils';
import { createTestUserData, createTestAdminData } from './test-utils-auth';
import { 
  users, 
  sessions, 
  passwordResetTokens, 
  userActivityLogs,
  states,
  categories,
  dataSources,
  statistics,
  importSessions,
  dataPoints
} from './db/schema';

// Global test database instance
let globalTestDb: TestDatabase;

// Global test setup - runs once before all tests
beforeAll(async () => {
  globalTestDb = createTestDatabase();
  await globalTestDb.populateFoundationData();
});

// Clean up after all tests
afterAll(async () => {
  if (globalTestDb) {
    await globalTestDb.cleanup();
  }
});

// Export utilities for use in individual tests
export const getTestDb = () => globalTestDb.db;
export const getTestDatabase = () => globalTestDb;

// Helper to create test users with proper database insertion
export const createTestUser = async (userData: any = {}) => {
  const db = getTestDb();
  const testData = createTestUserData(userData);
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(testData.password, 10);
  
  const [user] = await db.insert(users).values({
    email: testData.email,
    name: testData.name,
    passwordHash: hashedPassword,
    role: testData.role,
    isActive: 1,
    emailVerified: 1,
  }).returning();
  
  return user;
};

export const createTestAdmin = async (adminData: any = {}) => {
  const db = getTestDb();
  const testData = createTestAdminData(adminData);
  
  const bcrypt = require('bcryptjs');
  const hashedPassword = await bcrypt.hash(testData.password, 10);
  
  const [admin] = await db.insert(users).values({
    email: testData.email,
    name: testData.name,
    passwordHash: hashedPassword,
    role: testData.role,
    isActive: 1,
    emailVerified: 1,
  }).returning();
  
  return admin;
};

// Helper to create test sessions
export const createTestSession = async (userId: number) => {
  const db = getTestDb();
  const token = `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  
  const [session] = await db.insert(sessions).values({
    userId,
    token,
    expiresAt: Math.floor(expiresAt.getTime() / 1000), // Convert to Unix timestamp
  }).returning();
  
  return session;
};

// Helper to create test password reset tokens
export const createTestPasswordResetToken = async (userId: number) => {
  const db = getTestDb();
  const token = `test-reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  const [resetToken] = await db.insert(passwordResetTokens).values({
    userId,
    token,
    expiresAt: Math.floor(expiresAt.getTime() / 1000), // Convert to Unix timestamp
    used: 0,
  }).returning();
  
  return resetToken;
};

// Helper to get existing test data
export const getTestData = async () => {
  const db = getTestDb();
  
  const [adminUser] = await db.select().from(users).where(users.email.eq('admin@example.com')).limit(1);
  const [regularUser] = await db.select().from(users).where(users.email.eq('user@example.com')).limit(1);
  const [category] = await db.select().from(categories).where(categories.name.eq('Education')).limit(1);
  const [dataSource] = await db.select().from(dataSources).where(dataSources.name.eq('Bureau of Economic Analysis')).limit(1);
  const [state] = await db.select().from(states).where(states.name.eq('California')).limit(1);
  
  return {
    adminUser,
    regularUser,
    category,
    dataSource,
    state,
  };
};

// Helper to clear test data between tests
export const clearTestData = async () => {
  const db = getTestDb();
  
  // Clear in reverse dependency order
  await db.delete(dataPoints);
  await db.delete(sessions);
  await db.delete(passwordResetTokens);
  await db.delete(userActivityLogs);
  await db.delete(statistics);
  await db.delete(importSessions);
  await db.delete(users);
  await db.delete(states);
  await db.delete(categories);
  await db.delete(dataSources);
  
  // Re-populate foundation data
  await globalTestDb.populateFoundationData();
}; 