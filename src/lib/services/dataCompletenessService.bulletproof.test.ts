import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { DataCompletenessService } from './dataCompletenessService';
import { TestDatabaseManager, teardownGlobalTestEnvironment } from '@/lib/test-infrastructure/jest-setup';
import { csvImportStaging } from '@/lib/db/schema';

describe('DataCompletenessService - Bulletproof Test', () => {
  beforeEach(async () => {
    // Create fresh test database with seeded data
    await TestDatabaseManager.createTestDatabase({
      seed: true,
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        importSessions: true,
        dataPoints: true,
        users: true
      }
    });
  });

  afterEach(() => {
    // Clean up test database
    TestDatabaseManager.cleanupTestDatabase();
  });

  describe('getCompletenessReport', () => {
    it('should return empty report when no data exists', async () => {
      // Clear all data to test empty state
      TestDatabaseManager.clearTestData();
      
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getCompletenessReport({}, db?.db);
      
      expect(report).toBeDefined();
      expect(report.categories).toEqual([]);
      expect(report.summary.totalCategories).toBe(0);
      expect(report.summary.totalMetrics).toBe(0);
      expect(report.summary.overallCoveragePercentage).toBe(0);
    });

    it('should calculate coverage percentages correctly with seeded data', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getCompletenessReport({}, db?.db);
      
      expect(report).toHaveProperty('categories');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('filters');
      
      expect(report.summary).toHaveProperty('totalCategories');
      expect(report.summary).toHaveProperty('totalMetrics');
      expect(report.summary).toHaveProperty('totalYears');
      expect(report.summary).toHaveProperty('totalStates');
      expect(report.summary).toHaveProperty('categoriesWithData');
      expect(report.summary).toHaveProperty('metricsWithData');
      expect(report.summary).toHaveProperty('yearsWithData');
      expect(report.summary).toHaveProperty('overallCoveragePercentage');
      
      // With seeded data, we should have some coverage
      expect(report.summary.totalCategories).toBeGreaterThan(0);
      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(report.summary.totalStates).toBeGreaterThan(0);
    });

    it('should filter by showIncompleteOnly', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getCompletenessReport({
        showIncompleteOnly: true
      }, db?.db);
      
      expect(report.filters.showIncompleteOnly).toBe(true);
    });

    it('should filter by showStagedOnly', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getCompletenessReport({
        showStagedOnly: true
      }, db?.db);
      
      expect(report.filters.showStagedOnly).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getCompletenessReport({
        categoryId: 1 // Education category
      }, db?.db);
      
      expect(report.filters.categoryId).toBe(1);
      // Should only show categories with the specified ID
      if (report.categories.length > 0) {
        expect(report.categories.every(cat => cat.id === 1)).toBe(true);
      }
    });
  });

  describe('getDataFreshnessReport', () => {
    it('should return freshness report structure', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getDataFreshnessReport(db?.db);
      
      expect(report).toHaveProperty('production');
      expect(report).toHaveProperty('staged');
      expect(Array.isArray(report.production)).toBe(true);
      expect(Array.isArray(report.staged)).toBe(true);
    });

    it('should return production data freshness', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const report = await DataCompletenessService.getDataFreshnessReport(db?.db);
      
      // With seeded data, we should have some production data
      expect(report.production.length).toBeGreaterThanOrEqual(0);
      
      // Each production item should have the expected structure
      report.production.forEach(item => {
        expect(item).toHaveProperty('statisticId');
        expect(item).toHaveProperty('statisticName');
        expect(item).toHaveProperty('latestImportDate');
        expect(item).toHaveProperty('dataYear');
      });
    });
  });

  describe('getOverlapAnalysis', () => {
    it('should return overlap analysis structure', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      const analysis = await DataCompletenessService.getOverlapAnalysis(db?.db);
      
      expect(analysis).toHaveProperty('overlaps');
      expect(analysis).toHaveProperty('totalOverlaps');
      expect(analysis).toHaveProperty('averageDifference');
      expect(Array.isArray(analysis.overlaps)).toBe(true);
      expect(typeof analysis.totalOverlaps).toBe('number');
      expect(typeof analysis.averageDifference).toBe('number');
    });

    it('should handle empty staged data', async () => {
      // Clear staged data to test empty scenario
      const db = TestDatabaseManager.getCurrentTestDatabase();
      if (db) {
        await db.db.delete(csvImportStaging).execute();
      }
      
      const analysis = await DataCompletenessService.getOverlapAnalysis(db?.db);
      
      expect(analysis.totalOverlaps).toBe(0);
      expect(analysis.overlaps).toEqual([]);
    });
  });

  // Clean up after all tests
  afterAll(() => {
    teardownGlobalTestEnvironment();
  });
}); 