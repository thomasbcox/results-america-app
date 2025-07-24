import { 
  getSystemStats, 
  clearCache, 
  rebuildCache, 
  checkDataIntegrity 
} from './adminService';
import { AuthService } from './authService';
import { createTestDatabase } from '../testUtils';

describe('adminService', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await createTestDatabase();
  });

  afterEach(async () => {
    await testDb.cleanup();
  });

  describe('System Statistics', () => {
    it('should get system statistics', async () => {
      const stats = await getSystemStats();

      expect(stats).toBeDefined();
      expect(stats.totalStates).toBeGreaterThanOrEqual(0);
      expect(stats.totalCategories).toBeGreaterThanOrEqual(0);
      expect(stats.totalDataPoints).toBeGreaterThanOrEqual(0);
      expect(stats.totalStatistics).toBeGreaterThanOrEqual(0);
      expect(stats.cacheSize).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache', async () => {
      const result = await clearCache();

      expect(result).toBeUndefined(); // clearCache returns void
    });

    it('should rebuild cache', async () => {
      const result = await rebuildCache();

      expect(result).toBeUndefined(); // rebuildCache returns void
    });
  });

  describe('Data Management', () => {
    it('should check data integrity', async () => {
      const integrity = await checkDataIntegrity();

      expect(integrity).toBeDefined();
      expect(integrity.orphanedDataPoints).toBeGreaterThanOrEqual(0);
      expect(integrity.missingSources).toBeGreaterThanOrEqual(0);
      expect(integrity.duplicateStates).toBeGreaterThanOrEqual(0);
      expect(integrity.duplicateCategories).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(integrity.issues)).toBe(true);
    });
  });

  describe('User Management Integration', () => {
    it('should handle admin operations with user system', async () => {
      // Create admin user with unique email
      const uniqueEmail = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
      await AuthService.bootstrapAdminUser(uniqueEmail, 'Admin', 'password123');

      // Test that admin operations work with user system
      const stats = await getSystemStats();
      expect(stats).toBeDefined();

      const cacheResult = await clearCache();
      expect(cacheResult).toBeUndefined();
    });
  });
}); 