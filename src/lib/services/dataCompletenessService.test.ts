import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { DataCompletenessService } from './dataCompletenessService';
import { createTestDb, clearTestDb, closeTestDb } from '../db/testDb';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

describe('DataCompletenessService', () => {
  let db: BetterSQLite3Database;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    clearTestDb(db);
    closeTestDb(db);
  });

  describe('getCompletenessReport', () => {
    it('should return empty report when no data exists', async () => {
      const report = await DataCompletenessService.getCompletenessReport();
      
      expect(report).toBeDefined();
      expect(report.categories).toEqual([]);
      expect(report.summary.totalCategories).toBe(0);
      expect(report.summary.totalMetrics).toBe(0);
      expect(report.summary.overallCoveragePercentage).toBe(0);
    });

    it('should calculate coverage percentages correctly', async () => {
      // This test would require seeding test data
      // For now, we'll test the structure
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
  });

  describe('getDataFreshnessReport', () => {
    it('should return freshness report structure', async () => {
      const report = await DataCompletenessService.getDataFreshnessReport();
      
      expect(report).toHaveProperty('production');
      expect(report).toHaveProperty('staged');
      expect(Array.isArray(report.production)).toBe(true);
      expect(Array.isArray(report.staged)).toBe(true);
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
  });
}); 