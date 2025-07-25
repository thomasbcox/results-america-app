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

export interface TestUserData {
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'user' | 'viewer';
  isActive?: boolean;
  emailVerified?: boolean;
}

export interface TestSessionData {
  userId: number;
  token?: string;
  expiresAt?: Date;
}

export interface TestPasswordResetData {
  userId: number;
  token?: string;
  expiresAt?: Date;
  used?: boolean;
}

export interface TestCategoryData {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface TestDataSourceData {
  name: string;
  url?: string;
  description?: string;
}

export interface TestStateData {
  name: string;
  abbreviation: string;
}

export interface TestStatisticData {
  name: string;
  raNumber?: string;
  categoryId: number;
  dataSourceId?: number;
  description?: string;
  unit: string;
  availableSince?: string;
  dataQuality?: string;
  isActive?: boolean;
}

export interface TestDataPointData {
  statisticId: number;
  stateId: number;
  year: number;
  value: number;
  source?: string;
}

/**
 * Unified Test Factory System
 * 
 * This system provides standardized test data creation with proper relationships
 * and dependency management. All tests should use these factories instead of
 * direct database operations.
 */
export class TestFactories {
  private static readonly SALT_ROUNDS = 10;
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private static readonly RESET_TOKEN_DURATION = 60 * 60 * 1000; // 1 hour

  /**
   * Create a test user with proper password hashing
   */
  static async createUser(data: TestUserData) {
    const hashedPassword = await bcrypt.hash(data.password, this.SALT_ROUNDS);
    
    const [user] = await db.insert(users).values({
      email: data.email,
      name: data.name,
      passwordHash: hashedPassword,
      role: data.role,
      isActive: data.isActive ?? true,
      emailVerified: data.emailVerified ?? true,
    }).returning();
    
    return user;
  }

  /**
   * Create a test admin user
   */
  static async createAdmin(data: Partial<TestUserData> = {}) {
    const defaultData: TestUserData = {
      email: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      name: 'Admin User',
      password: 'password123',
      role: 'admin',
      ...data
    };
    
    return this.createUser(defaultData);
  }

  /**
   * Create a test regular user
   */
  static async createRegularUser(data: Partial<TestUserData> = {}) {
    const defaultData: TestUserData = {
      email: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      name: 'Regular User',
      password: 'password123',
      role: 'user',
      ...data
    };
    
    return this.createUser(defaultData);
  }

  /**
   * Create a test viewer user
   */
  static async createViewerUser(data: Partial<TestUserData> = {}) {
    const defaultData: TestUserData = {
      email: `viewer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
      name: 'Viewer User',
      password: 'password123',
      role: 'viewer',
      ...data
    };
    
    return this.createUser(defaultData);
  }

  /**
   * Create a test session for a user
   */
  static async createSession(data: TestSessionData) {
    const token = data.token || `test-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = data.expiresAt || new Date(Date.now() + this.SESSION_DURATION);
    
    const [session] = await db.insert(sessions).values({
      userId: data.userId,
      token,
      expiresAt: Math.floor(expiresAt.getTime() / 1000), // Convert to Unix timestamp
    }).returning();
    
    return session;
  }

  /**
   * Create a test password reset token
   */
  static async createPasswordResetToken(data: TestPasswordResetData) {
    const token = data.token || `test-reset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = data.expiresAt || new Date(Date.now() + this.RESET_TOKEN_DURATION);
    
    const [resetToken] = await db.insert(passwordResetTokens).values({
      userId: data.userId,
      token,
      expiresAt: Math.floor(expiresAt.getTime() / 1000), // Convert to Unix timestamp
      used: data.used ?? false,
    }).returning();
    
    return resetToken;
  }

  /**
   * Create a test category
   */
  static async createCategory(data: TestCategoryData) {
    const [category] = await db.insert(categories).values({
      name: data.name,
      description: data.description || `${data.name} description`,
      icon: data.icon || 'Icon',
      sortOrder: data.sortOrder || 1,
    }).returning();
    
    return category;
  }

  /**
   * Create a test data source
   */
  static async createDataSource(data: TestDataSourceData) {
    const [dataSource] = await db.insert(dataSources).values({
      name: data.name,
      url: data.url || `https://${data.name.toLowerCase().replace(/\s+/g, '')}.gov`,
      description: data.description || `${data.name} data source`,
    }).returning();
    
    return dataSource;
  }

  /**
   * Create a test state
   */
  static async createState(data: TestStateData) {
    const [state] = await db.insert(states).values({
      name: data.name,
      abbreviation: data.abbreviation,
    }).returning();
    
    return state;
  }

  /**
   * Create a test statistic
   */
  static async createStatistic(data: TestStatisticData) {
    const [statistic] = await db.insert(statistics).values({
      name: data.name,
      raNumber: data.raNumber || `RA${Math.floor(Math.random() * 9999)}`,
      categoryId: data.categoryId,
      dataSourceId: data.dataSourceId,
      description: data.description || `${data.name} description`,
      unit: data.unit,
      availableSince: data.availableSince || '2020',
      dataQuality: data.dataQuality || 'high',
      isActive: data.isActive ?? true,
    }).returning();
    
    return statistic;
  }

  /**
   * Create a test data point
   */
  static async createDataPoint(data: TestDataPointData) {
    const [dataPoint] = await db.insert(dataPoints).values({
      statisticId: data.statisticId,
      stateId: data.stateId,
      year: data.year,
      value: data.value,
      source: data.source || 'Test Source',
    }).returning();
    
    return dataPoint;
  }

  /**
   * Create a complete test dataset with all relationships
   */
  static async createCompleteTestDataset() {
    // Create foundation data
    const category = await this.createCategory({
      name: 'Test Category',
      description: 'Test category for testing',
      icon: 'TestIcon',
      sortOrder: 1
    });

    const dataSource = await this.createDataSource({
      name: 'Test Data Source',
      url: 'https://testdatasource.gov',
      description: 'Test data source for testing'
    });

    const state = await this.createState({
      name: 'Test State',
      abbreviation: 'TS'
    });

    const statistic = await this.createStatistic({
      name: 'Test Statistic',
      raNumber: 'RA1234',
      categoryId: category.id,
      dataSourceId: dataSource.id,
      description: 'Test statistic for testing',
      unit: 'Test Unit',
      availableSince: '2020',
      dataQuality: 'high'
    });

    const dataPoint = await this.createDataPoint({
      statisticId: statistic.id,
      stateId: state.id,
      year: 2023,
      value: 100.5,
      source: 'Test Source'
    });

    // Create users
    const admin = await this.createAdmin();
    const user = await this.createRegularUser();
    const viewer = await this.createViewerUser();

    // Create sessions
    const adminSession = await this.createSession({ userId: admin.id });
    const userSession = await this.createSession({ userId: user.id });

    return {
      category,
      dataSource,
      state,
      statistic,
      dataPoint,
      admin,
      user,
      viewer,
      adminSession,
      userSession
    };
  }

  /**
   * Clear all test data in proper dependency order
   */
  static async clearAllTestData() {
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
  }

  /**
   * Get a user by email
   */
  static async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user || null;
  }

  /**
   * Verify a user's password
   */
  static async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) return false;
    
    return bcrypt.compare(password, user.passwordHash);
  }

  /**
   * Create an expired session for testing
   */
  static async createExpiredSession(userId: number) {
    const expiredAt = new Date(Date.now() - this.SESSION_DURATION); // Expired 24 hours ago
    return this.createSession({
      userId,
      expiresAt: expiredAt
    });
  }

  /**
   * Create an expired password reset token for testing
   */
  static async createExpiredPasswordResetToken(userId: number) {
    const expiredAt = new Date(Date.now() - this.RESET_TOKEN_DURATION); // Expired 1 hour ago
    return this.createPasswordResetToken({
      userId,
      expiresAt: expiredAt
    });
  }

  /**
   * Create a used password reset token for testing
   */
  static async createUsedPasswordResetToken(userId: number) {
    return this.createPasswordResetToken({
      userId,
      used: true
    });
  }
} 