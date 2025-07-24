import { createTestDb } from '../db/testDb';
import * as adminService from './adminService';
import { createDataSource, createCategory, createState, createStatistic, clearAllTestData } from './testUtils';
import { AuthService } from './authService';
import bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  default: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));

let db;

beforeEach(async () => {
  db = createTestDb();
      // Reset mocks
    jest.clearAllMocks();
});

afterEach(async () => {
  await clearAllTestData(db);
});

describe('adminService', () => {
  it('should get system stats', async () => {
    // Create some test data
    await createState(db);
    await createCategory(db);
    await createDataSource(db);
    const category = await createCategory(db, { name: 'Test Category' });
    const dataSource = await createDataSource(db, { name: 'Test Source' });
    await createStatistic(db, { categoryId: category.id, dataSourceId: dataSource.id });

    const stats = await adminService.getSystemStats();

    expect(stats.totalStates).toBeGreaterThan(0);
    expect(stats.totalCategories).toBeGreaterThan(0);
    expect(stats.totalStatistics).toBeGreaterThan(0);
    expect(stats.totalDataSources).toBeGreaterThan(0);
    expect(stats.totalDataPoints).toBeGreaterThanOrEqual(0);
    expect(stats.totalImportSessions).toBeGreaterThanOrEqual(0);
    expect(stats.cacheSize).toBe(0); // Cache size not implemented yet
  });

  it('should check data integrity with no issues', async () => {
    // Create valid test data
    const category = await createCategory(db);
    const dataSource = await createDataSource(db);
    const state = await createState(db);
    const statistic = await createStatistic(db, { categoryId: category.id, dataSourceId: dataSource.id });

    const integrity = await adminService.checkDataIntegrity();

    expect(integrity.orphanedDataPoints).toBe(0);
    expect(integrity.missingSources).toBe(0);
    expect(integrity.duplicateStates).toBe(0);
    expect(integrity.duplicateCategories).toBe(0);
    expect(integrity.issues).toHaveLength(0);
  });

  it('should clear cache', async () => {
    // This test verifies the function doesn't throw
    await expect(adminService.clearCache()).resolves.not.toThrow();
  });

  it('should rebuild cache', async () => {
    // Create some test data first
    await createState(db);
    await createCategory(db);
    await createDataSource(db);

    // This test verifies the function doesn't throw
    await expect(adminService.rebuildCache()).resolves.not.toThrow();
  });

  it('should cleanup orphaned data', async () => {
    const result = await adminService.cleanupOrphanedData();

    expect(result).toHaveProperty('cleaned');
    expect(result).toHaveProperty('errors');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(typeof result.cleaned).toBe('number');
  });

  describe('User Management Integration', () => {
    it('should include user statistics in system stats', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as any).mockResolvedValue(mockHash);

      // Create some users
      await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');
      await AuthService.createUser({
        email: 'user1@example.com',
        name: 'User 1',
        password: 'password123',
      });
      await AuthService.createUser({
        email: 'user2@example.com',
        name: 'User 2',
        password: 'password123',
      });

      const stats = await adminService.getSystemStats();

      expect(stats).toHaveProperty('totalUsers');
      expect(stats).toHaveProperty('activeUsers');
      expect(stats).toHaveProperty('adminUsers');
      expect(stats.totalUsers).toBeGreaterThanOrEqual(3);
      expect(stats.adminUsers).toBeGreaterThanOrEqual(1);
    });

    it('should handle user management in admin operations', async () => {
      const mockHash = 'hashed-password-123';
      (bcrypt.hash as any).mockResolvedValue(mockHash);

      // Create admin user
      await AuthService.bootstrapAdminUser('admin@example.com', 'Admin', 'password123');

      // Test that admin operations work with user system
      const stats = await adminService.getSystemStats();
      expect(stats.adminUsers).toBeGreaterThan(0);

      const integrity = await adminService.checkDataIntegrity();
      expect(integrity).toBeDefined();
    });
  });
}); 