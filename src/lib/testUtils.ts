import { createTestDb } from './db/testDb';
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

export interface TestDatabase {
  db: any;
  cleanup: () => Promise<void>;
  populateFoundationData: () => Promise<void>;
  clearAllData: () => Promise<void>;
}

/**
 * DEPENDENCY-BASED DATABASE MANAGEMENT
 * 
 * Tables must be populated in dependency order to avoid foreign key violations:
 * 
 * GROUP 1: Foundation Tables (No Foreign Keys)
 * - users, states, categories, data_sources
 * 
 * GROUP 2: First-Level Dependencies  
 * - sessions, password_reset_tokens, user_activity_logs, statistics, import_sessions
 * 
 * GROUP 3: Second-Level Dependencies
 * - data_points
 */

export function createTestDatabase(): TestDatabase {
  const db = createTestDb();
  
  // Clear all data in REVERSE dependency order (dependent tables first)
  const clearAllData = async () => {
    try {
      // GROUP 3: Second-Level Dependencies
      await db.delete(dataPoints);
      
      // GROUP 2: First-Level Dependencies
      await db.delete(sessions);
      await db.delete(passwordResetTokens);
      await db.delete(userActivityLogs);
      await db.delete(statistics);
      await db.delete(importSessions);
      
      // GROUP 1: Foundation Tables
      await db.delete(users);
      await db.delete(states);
      await db.delete(categories);
      await db.delete(dataSources);
    } catch (error) {
      console.warn('Cleanup warning:', error);
    }
  };

  // Populate foundation data in dependency order
  const populateFoundationData = async () => {
    // GROUP 1: Foundation Tables (No Foreign Keys)
    
    // Create test states
    await db.insert(states).values([
      { name: 'California', abbreviation: 'CA', isActive: 1 },
      { name: 'Texas', abbreviation: 'TX', isActive: 1 },
      { name: 'New York', abbreviation: 'NY', isActive: 1 },
    ]).onConflictDoNothing();

    // Create test categories
    await db.insert(categories).values([
      { name: 'Education', description: 'Educational metrics', icon: 'graduation-cap', sortOrder: 1, isActive: 1 },
      { name: 'Economy', description: 'Economic indicators', icon: 'trending-up', sortOrder: 2, isActive: 1 },
      { name: 'Health', description: 'Health statistics', icon: 'heart', sortOrder: 3, isActive: 1 },
    ]).onConflictDoNothing();

    // Create test data sources
    await db.insert(dataSources).values([
      { name: 'Bureau of Economic Analysis', description: 'BEA economic data', url: 'https://www.bea.gov', isActive: 1 },
      { name: 'Bureau of Labor Statistics', description: 'BLS employment data', url: 'https://www.bls.gov', isActive: 1 },
      { name: 'US Census Bureau', description: 'Census demographic data', url: 'https://www.census.gov', isActive: 1 },
    ]).onConflictDoNothing();

    // Create test users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    await db.insert(users).values([
      {
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash: hashedPassword,
        role: 'admin',
        isActive: 1,
        emailVerified: 1,
      },
      {
        email: 'user@example.com',
        name: 'Regular User',
        passwordHash: hashedPassword,
        role: 'user',
        isActive: 1,
        emailVerified: 1,
      },
    ]).onConflictDoNothing();

    // GROUP 2: First-Level Dependencies (after foundation tables exist)
    
    // Get IDs for foreign key references
    const [category] = await db.select().from(categories).where(eq(categories.name, 'Education')).limit(1);
    const [dataSource] = await db.select().from(dataSources).where(eq(dataSources.name, 'Bureau of Economic Analysis')).limit(1);
    const [user] = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);

    if (category && dataSource) {
      // Create test statistics
      await db.insert(statistics).values([
        {
          raNumber: '1001',
          categoryId: category.id,
          dataSourceId: dataSource.id,
          name: 'High School Graduation Rate',
          description: 'Percentage of students graduating high school',
          unit: 'percentage',
          isActive: 1,
        },
      ]).onConflictDoNothing();
    }

    if (dataSource) {
      // Create test import sessions
      await db.insert(importSessions).values([
        {
          name: '2023 Annual Data Import',
          description: 'Annual data import for 2023',
          dataSourceId: dataSource.id,
          dataYear: 2023,
          recordCount: 1000,
          isActive: 1,
        },
      ]).onConflictDoNothing();
    }
  };

  const cleanup = async () => {
    await clearAllData();
  };

  return { db, cleanup, populateFoundationData, clearAllData };
}

// Test data factories with unique identifiers
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

// Helper to create a test user in the database (after foundation data exists)
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

// Import required for foreign key lookups
import { eq } from 'drizzle-orm'; 