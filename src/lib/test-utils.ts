// Simple Test Factory Functions
// Following the ideal pattern from the programming guide - no complex builders

import { db } from './db';
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
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import type { 
  User, 
  StateData, 
  CategoryData, 
  StatisticData, 
  DataPointData,
  CreateUserInput,
  CreateStateInput,
  CreateCategoryInput,
  CreateStatisticInput,
  CreateDataPointInput
} from './types/service-interfaces';

// ============================================================================
// USER TEST FACTORIES
// ============================================================================

export const createTestUserData = (overrides: Partial<CreateUserInput> = {}): CreateUserInput => ({
  email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
  name: 'Test User',
  password: 'password123',
  role: 'user',
  ...overrides
});

export const insertTestUser = async (data: CreateUserInput): Promise<User> => {
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  const [user] = await db.insert(users).values({
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash,
    role: data.role || 'user',
  }).returning();

  return {
    ...user,
    lastLoginAt: user.lastLoginAt || undefined
  };
};

export const createTestUser = async (overrides: Partial<CreateUserInput> = {}): Promise<User> => {
  const data = createTestUserData(overrides);
  return await insertTestUser(data);
};

export const createTestAdmin = async (overrides: Partial<CreateUserInput> = {}): Promise<User> => {
  return await createTestUser({ ...overrides, role: 'admin' });
};

export const createTestViewer = async (overrides: Partial<CreateUserInput> = {}): Promise<User> => {
  return await createTestUser({ ...overrides, role: 'viewer' });
};

// ============================================================================
// STATE TEST FACTORIES
// ============================================================================

export const createTestStateData = (overrides: Partial<CreateStateInput> = {}): CreateStateInput => ({
  name: `Test State ${Date.now()}`,
  abbreviation: `TS${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
  ...overrides
});

export const insertTestState = async (data: CreateStateInput): Promise<StateData> => {
  const [state] = await db.insert(states).values(data).returning();
  return state;
};

export const createTestState = async (overrides: Partial<CreateStateInput> = {}): Promise<StateData> => {
  const data = createTestStateData(overrides);
  return await insertTestState(data);
};

// ============================================================================
// CATEGORY TEST FACTORIES
// ============================================================================

export const createTestCategoryData = (overrides: Partial<CreateCategoryInput> = {}): CreateCategoryInput => ({
  name: `Test Category ${Date.now()}`,
  description: 'Test category description',
  icon: 'test-icon',
  sortOrder: 1,
  ...overrides
});

export const insertTestCategory = async (data: CreateCategoryInput): Promise<CategoryData> => {
  const [category] = await db.insert(categories).values(data).returning();
  return category;
};

export const createTestCategory = async (overrides: Partial<CreateCategoryInput> = {}): Promise<CategoryData> => {
  const data = createTestCategoryData(overrides);
  return await insertTestCategory(data);
};

// ============================================================================
// DATA SOURCE TEST FACTORIES
// ============================================================================

export const createTestDataSourceData = (overrides: Partial<{ name: string; description?: string; url?: string }> = {}): { name: string; description?: string; url?: string } => ({
  name: `Test Source ${Date.now()}`,
  description: 'Test data source',
  url: 'https://example.com',
  ...overrides
});

export const insertTestDataSource = async (data: { name: string; description?: string; url?: string }): Promise<any> => {
  const [dataSource] = await db.insert(dataSources).values(data).returning();
  return dataSource;
};

export const createTestDataSource = async (overrides: Partial<{ name: string; description?: string; url?: string }> = {}): Promise<any> => {
  const data = createTestDataSourceData(overrides);
  return await insertTestDataSource(data);
};

// ============================================================================
// STATISTIC TEST FACTORIES
// ============================================================================

export const createTestStatisticData = (overrides: Partial<CreateStatisticInput> = {}): CreateStatisticInput => ({
  name: `Test Statistic ${Date.now()}`,
  categoryId: 1, // Will be overridden in practice
  unit: 'percent',
  description: 'Test statistic description',
  dataQuality: 'mock',
  ...overrides
});

export const insertTestStatistic = async (data: CreateStatisticInput): Promise<StatisticData> => {
  const [statistic] = await db.insert(statistics).values(data).returning();
  return statistic;
};

export const createTestStatistic = async (overrides: Partial<CreateStatisticInput> = {}): Promise<StatisticData> => {
  const data = createTestStatisticData(overrides);
  return await insertTestStatistic(data);
};

// ============================================================================
// DATA POINT TEST FACTORIES
// ============================================================================

export const createTestDataPointData = (overrides: Partial<CreateDataPointInput> = {}): CreateDataPointInput => ({
  statisticId: 1, // Will be overridden in practice
  stateId: 1, // Will be overridden in practice
  year: 2023,
  value: 75.5,
  source: 'test-source',
  ...overrides
});

export const insertTestDataPoint = async (data: CreateDataPointInput): Promise<DataPointData> => {
  const [dataPoint] = await db.insert(dataPoints).values(data).returning();
  return dataPoint;
};

export const createTestDataPoint = async (overrides: Partial<CreateDataPointInput> = {}): Promise<DataPointData> => {
  const data = createTestDataPointData(overrides);
  return await insertTestDataPoint(data);
};

// ============================================================================
// SESSION TEST FACTORIES
// ============================================================================

export const createTestSessionData = (overrides: Partial<{ userId: number; token?: string; expiresAt?: Date }> = {}): { userId: number; token?: string; expiresAt?: Date } => ({
  userId: 1, // Will be overridden in practice
  token: `test-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  ...overrides
});

export const insertTestSession = async (data: { userId: number; token?: string; expiresAt?: Date }): Promise<any> => {
  const [session] = await db.insert(sessions).values(data).returning();
  return session;
};

export const createTestSession = async (overrides: Partial<{ userId: number; token?: string; expiresAt?: Date }> = {}): Promise<any> => {
  const data = createTestSessionData(overrides);
  return await insertTestSession(data);
};

// ============================================================================
// COMPLEX SCENARIO FACTORIES
// ============================================================================

export const createTestUserWithSession = async (overrides = {}) => {
  const user = await createTestUser(overrides.user);
  const session = await createTestSession({ 
    userId: user.id,
    ...overrides.session 
  });
  
  return { user, session };
};

export const createTestStateWithData = async (overrides = {}) => {
  const state = await createTestState(overrides.state);
  const category = await createTestCategory(overrides.category);
  const dataSource = await createTestDataSource(overrides.dataSource);
  const statistic = await createTestStatistic({ 
    categoryId: category.id,
    dataSourceId: dataSource.id,
    ...overrides.statistic 
  });
  const dataPoint = await createTestDataPoint({
    stateId: state.id,
    statisticId: statistic.id,
    ...overrides.dataPoint
  });
  
  return { state, category, dataSource, statistic, dataPoint };
};

// ============================================================================
// CLEANUP UTILITIES
// ============================================================================

export const cleanup = async () => {
  // Clean up in dependency order to avoid foreign key violations
  await db.delete(userActivityLogs);
  await db.delete(passwordResetTokens);
  await db.delete(sessions);
  await db.delete(dataPoints);
  await db.delete(statistics);
  await db.delete(dataSources);
  await db.delete(categories);
  await db.delete(states);
  await db.delete(users);
  await db.delete(importSessions);
};

export const cleanupUsers = async () => {
  await db.delete(userActivityLogs);
  await db.delete(passwordResetTokens);
  await db.delete(sessions);
  await db.delete(users);
};

export const cleanupData = async () => {
  await db.delete(dataPoints);
  await db.delete(statistics);
  await db.delete(dataSources);
  await db.delete(categories);
  await db.delete(states);
  await db.delete(importSessions);
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  if (!user) return null;
  
  return {
    ...user,
    lastLoginAt: user.lastLoginAt || undefined
  };
};

export const verifyUserPassword = async (userId: number, password: string): Promise<boolean> => {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;
  
  return bcrypt.compare(password, user.passwordHash);
};

export const createExpiredSession = async (userId: number) => {
  const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
  return await createTestSession({ userId, expiresAt: expiredDate });
};

export const createExpiredPasswordResetToken = async (userId: number) => {
  const expiredDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
  const [token] = await db.insert(passwordResetTokens).values({
    userId,
    token: `expired-token-${Date.now()}`,
    expiresAt: expiredDate,
    used: false
  }).returning();
  return token;
};

export const createUsedPasswordResetToken = async (userId: number) => {
  const [token] = await db.insert(passwordResetTokens).values({
    userId,
    token: `used-token-${Date.now()}`,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    used: true
  }).returning();
  return token;
}; 