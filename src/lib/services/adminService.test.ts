import { AdminService } from './adminService';
import { db } from '../db/index';

describe('adminService', () => {
  describe('System Statistics', () => {
    it('should get system statistics', async () => {
      const stats = await AdminService.getSystemStats();

      expect(stats).toBeDefined();
      expect(stats.totalStates).toBeGreaterThanOrEqual(0);
      expect(stats.totalCategories).toBeGreaterThanOrEqual(0);
      expect(stats.totalStatistics).toBeGreaterThanOrEqual(0);
      expect(stats.totalDataPoints).toBeGreaterThanOrEqual(0);
      expect(stats.totalDataSources).toBeGreaterThanOrEqual(0);
      expect(stats.totalImportSessions).toBeGreaterThanOrEqual(0);
    });

    it('should clear cache', async () => {
      const result = await AdminService.clearCache();
      expect(result).toBeUndefined(); // clearCache returns void
    });

    it('should rebuild cache', async () => {
      const result = await AdminService.rebuildCache();
      expect(result).toBeUndefined(); // rebuildCache returns void
    });
  });

  describe('Data Management', () => {
    it('should check data integrity', async () => {
      const integrity = await AdminService.checkDataIntegrity();

      expect(integrity).toBeDefined();
      expect(integrity.orphanedDataPoints).toBeGreaterThanOrEqual(0);
      expect(integrity.missingSources).toBeGreaterThanOrEqual(0);
      expect(integrity.duplicateStates).toBeGreaterThanOrEqual(0);
      expect(integrity.duplicateCategories).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(integrity.issues)).toBe(true);
    });

    it('should cleanup orphaned data', async () => {
      const result = await AdminService.cleanupOrphanedData();

      expect(result).toBeDefined();
      expect(result.cleaned).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe('Analytics', () => {
    it('should get analytics data', async () => {
      const analytics = await AdminService.getAnalyticsData('24h');

      expect(analytics).toBeDefined();
      expect(analytics.period).toBe('24h');
      expect(analytics.metrics).toBeDefined();
      expect(analytics.metrics.totalUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.metrics.activeUsers).toBeGreaterThanOrEqual(0);
      expect(analytics.metrics.dataRequests).toBeGreaterThanOrEqual(0);
      expect(analytics.metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
    });
  });
}); 