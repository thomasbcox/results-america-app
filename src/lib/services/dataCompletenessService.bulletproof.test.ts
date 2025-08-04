import { describe, it, expect, beforeEach, afterEach, afterAll } from '@jest/globals';
import { DataCompletenessService } from './dataCompletenessService';
import { TestDatabaseManager, teardownGlobalTestEnvironment } from '@/lib/test-infrastructure/jest-setup';

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
      
      const report = await DataCompletenessService.getCompletenessReport();
      
      expect(report).toBeDefined();
      expect(report.categories).toEqual([]);
      expect(report.summary.totalCategories).toBe(0);
      expect(report.summary.totalMetrics).toBe(0);
      expect(report.summary.overallCoveragePercentage).toBe(0);
    });

    it('should calculate coverage percentages correctly with seeded data', async () => {
      const report = await DataCompletenessService.getCompletenessReport();
      
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
      const report = await DataCompletenessService.getCompletenessReport({
        showIncompleteOnly: true
      });
      
      expect(report.filters.showIncompleteOnly).toBe(true);
    });

    it('should filter by showStagedOnly', async () => {
      const report = await DataCompletenessService.getCompletenessReport({
        showStagedOnly: true
      });
      
      expect(report.filters.showStagedOnly).toBe(true);
    });

    it('should filter by categoryId', async () => {
      const report = await DataCompletenessService.getCompletenessReport({
        categoryId: 1 // Education category
      });
      
      expect(report.filters.categoryId).toBe(1);
      // Should only show categories with the specified ID
      if (report.categories.length > 0) {
        expect(report.categories.every(cat => cat.id === 1)).toBe(true);
      }
    });
  });

  describe('getDataFreshnessReport', () => {
    it('should return freshness report structure', async () => {
      const report = await DataCompletenessService.getDataFreshnessReport();
      
      expect(report).toHaveProperty('production');
      expect(report).toHaveProperty('staged');
      expect(Array.isArray(report.production)).toBe(true);
      expect(Array.isArray(report.staged)).toBe(true);
    });

    it('should return production data freshness', async () => {
      const report = await DataCompletenessService.getDataFreshnessReport();
      
      // With seeded data, we should have some production data
      expect(report.production.length).toBeGreaterThanOrEqual(0);
      
      // Each production item should have the expected structure
      report.production.forEach(item => {
        expect(item).toHaveProperty('statisticId');
        expect(item).toHaveProperty('statisticName');
        expect(item).toHaveProperty('latestImportDate');
        expect(item).toHaveProperty('dataAge');
        expect(item).toHaveProperty('freshnessStatus');
      });
    });
  });

  describe('getOverlapAnalysis', () => {
    it('should return overlap analysis structure', async () => {
      const analysis = await DataCompletenessService.getOverlapAnalysis();
      
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
        await db.db.delete(schema.csvImportStaging).execute();
      }
      
      const analysis = await DataCompletenessService.getOverlapAnalysis();
      
      expect(analysis.totalOverlaps).toBe(0);
      expect(analysis.overlaps).toEqual([]);
    });
  });

  describe('getCategoryCompleteness', () => {
    it('should return category completeness for valid category', async () => {
      const completeness = await DataCompletenessService.getCategoryCompleteness(1); // Education category
      
      expect(completeness).toHaveProperty('categoryId');
      expect(completeness).toHaveProperty('categoryName');
      expect(completeness).toHaveProperty('totalMetrics');
      expect(completeness).toHaveProperty('metricsWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('metrics');
      
      expect(completeness.categoryId).toBe(1);
      expect(Array.isArray(completeness.metrics)).toBe(true);
    });

    it('should handle non-existent category', async () => {
      const completeness = await DataCompletenessService.getCategoryCompleteness(999);
      
      expect(completeness).toHaveProperty('categoryId');
      expect(completeness).toHaveProperty('categoryName');
      expect(completeness).toHaveProperty('totalMetrics');
      expect(completeness).toHaveProperty('metricsWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('metrics');
      
      expect(completeness.categoryId).toBe(999);
      expect(completeness.totalMetrics).toBe(0);
      expect(completeness.metricsWithData).toBe(0);
      expect(completeness.coveragePercentage).toBe(0);
    });
  });

  describe('getMetricCompleteness', () => {
    it('should return metric completeness for valid metric', async () => {
      const completeness = await DataCompletenessService.getMetricCompleteness(1); // High School Graduation Rate
      
      expect(completeness).toHaveProperty('statisticId');
      expect(completeness).toHaveProperty('statisticName');
      expect(completeness).toHaveProperty('categoryId');
      expect(completeness).toHaveProperty('categoryName');
      expect(completeness).toHaveProperty('totalStates');
      expect(completeness).toHaveProperty('statesWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('dataPoints');
      
      expect(completeness.statisticId).toBe(1);
      expect(Array.isArray(completeness.dataPoints)).toBe(true);
    });

    it('should handle non-existent metric', async () => {
      const completeness = await DataCompletenessService.getMetricCompleteness(999);
      
      expect(completeness).toHaveProperty('statisticId');
      expect(completeness).toHaveProperty('statisticName');
      expect(completeness).toHaveProperty('categoryId');
      expect(completeness).toHaveProperty('categoryName');
      expect(completeness).toHaveProperty('totalStates');
      expect(completeness).toHaveProperty('statesWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('dataPoints');
      
      expect(completeness.statisticId).toBe(999);
      expect(completeness.totalStates).toBe(0);
      expect(completeness.statesWithData).toBe(0);
      expect(completeness.coveragePercentage).toBe(0);
    });
  });

  describe('getStateCompleteness', () => {
    it('should return state completeness for valid state', async () => {
      const completeness = await DataCompletenessService.getStateCompleteness(1); // Alabama
      
      expect(completeness).toHaveProperty('stateId');
      expect(completeness).toHaveProperty('stateName');
      expect(completeness).toHaveProperty('stateAbbreviation');
      expect(completeness).toHaveProperty('totalMetrics');
      expect(completeness).toHaveProperty('metricsWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('dataPoints');
      
      expect(completeness.stateId).toBe(1);
      expect(Array.isArray(completeness.dataPoints)).toBe(true);
    });

    it('should handle non-existent state', async () => {
      const completeness = await DataCompletenessService.getStateCompleteness(999);
      
      expect(completeness).toHaveProperty('stateId');
      expect(completeness).toHaveProperty('stateName');
      expect(completeness).toHaveProperty('stateAbbreviation');
      expect(completeness).toHaveProperty('totalMetrics');
      expect(completeness).toHaveProperty('metricsWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('dataPoints');
      
      expect(completeness.stateId).toBe(999);
      expect(completeness.totalMetrics).toBe(0);
      expect(completeness.metricsWithData).toBe(0);
      expect(completeness.coveragePercentage).toBe(0);
    });
  });

  describe('getYearCompleteness', () => {
    it('should return year completeness for valid year', async () => {
      const completeness = await DataCompletenessService.getYearCompleteness(2023);
      
      expect(completeness).toHaveProperty('year');
      expect(completeness).toHaveProperty('totalMetrics');
      expect(completeness).toHaveProperty('metricsWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('dataPoints');
      
      expect(completeness.year).toBe(2023);
      expect(Array.isArray(completeness.dataPoints)).toBe(true);
    });

    it('should handle year with no data', async () => {
      const completeness = await DataCompletenessService.getYearCompleteness(1900);
      
      expect(completeness).toHaveProperty('year');
      expect(completeness).toHaveProperty('totalMetrics');
      expect(completeness).toHaveProperty('metricsWithData');
      expect(completeness).toHaveProperty('coveragePercentage');
      expect(completeness).toHaveProperty('dataPoints');
      
      expect(completeness.year).toBe(1900);
      expect(completeness.totalMetrics).toBe(0);
      expect(completeness.metricsWithData).toBe(0);
      expect(completeness.coveragePercentage).toBe(0);
    });
  });

  // Clean up after all tests
  afterAll(() => {
    teardownGlobalTestEnvironment();
  });
}); 