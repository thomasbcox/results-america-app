import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { DataCompletenessService, DataCompletenessReport, CompletenessFilters } from './dataCompletenessService';
import { 
  statistics, 
  dataPoints, 
  categories, 
  importSessions, 
  csvImportStaging,
  states 
} from '../db/schema';
import { eq, and, count, sql, inArray, isNull, isNotNull } from 'drizzle-orm';

describe('DataCompletenessService', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        importSessions: true,
        dataPoints: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('Completeness Report', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create test data points to test completeness
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 150.0
        },
        {
          importSessionId: 1,
          year: 2022,
          stateId: 1,
          statisticId: 1,
          value: 95.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 2,
          value: 200.0
        }
      ]);
    });

    it('should generate completeness report', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      expect(report).toHaveProperty('categories');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('filters');
      
      expect(Array.isArray(report.categories)).toBe(true);
      expect(report.categories.length).toBeGreaterThan(0);
      
      // Check summary structure
      expect(report.summary).toHaveProperty('totalCategories');
      expect(report.summary).toHaveProperty('totalMetrics');
      expect(report.summary).toHaveProperty('totalYears');
      expect(report.summary).toHaveProperty('totalStates');
      expect(report.summary).toHaveProperty('categoriesWithData');
      expect(report.summary).toHaveProperty('metricsWithData');
      expect(report.summary).toHaveProperty('yearsWithData');
      expect(report.summary).toHaveProperty('overallCoveragePercentage');
    });

    it('should filter by category', async () => {
      const db = testDb.db;
      
      // Get first category
      const categories = await db.select().from(categories).limit(1);
      const categoryId = categories[0].id;
      
      const report = await DataCompletenessService.getCompletenessReport({ categoryId }, db);
      
      expect(report.categories).toHaveLength(1);
      expect(report.categories[0].id).toBe(categoryId);
    });

    it('should filter by metric', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({ metricId: 1 }, db);
      
      // Should only include metrics with ID 1
      report.categories.forEach(category => {
        category.metrics.forEach(metric => {
          expect(metric.id).toBe(1);
        });
      });
    });

    it('should filter by year', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({ year: 2023 }, db);
      
      // Check that only 2023 data is included
      report.categories.forEach(category => {
        category.metrics.forEach(metric => {
          metric.years.forEach(year => {
            expect(year.year).toBe(2023);
          });
        });
      });
    });

    it('should show incomplete data only', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({ 
        showIncompleteOnly: true 
      }, db);
      
      // Should only include categories/metrics with incomplete data
      report.categories.forEach(category => {
        expect(category.coveragePercentage).toBeLessThan(100);
      });
    });
  });

  describe('Category Completeness', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create comprehensive test data
      await db.insert(dataPoints).values([
        // Category 1 - Complete data
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 150.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 3,
          statisticId: 1,
          value: 200.0
        },
        // Category 2 - Partial data
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 2,
          value: 300.0
        }
      ]);
    });

    it('should calculate category coverage correctly', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      // Find categories with data
      const categoriesWithData = report.categories.filter(cat => cat.metricsWithData > 0);
      
      categoriesWithData.forEach(category => {
        expect(category.totalMetrics).toBeGreaterThan(0);
        expect(category.metricsWithData).toBeGreaterThan(0);
        expect(category.coveragePercentage).toBeGreaterThan(0);
        expect(category.coveragePercentage).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate metric coverage correctly', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      report.categories.forEach(category => {
        category.metrics.forEach(metric => {
          expect(metric.totalYears).toBeGreaterThan(0);
          expect(metric.yearsWithData).toBeGreaterThanOrEqual(0);
          expect(metric.coveragePercentage).toBeGreaterThanOrEqual(0);
          expect(metric.coveragePercentage).toBeLessThanOrEqual(100);
          
          metric.years.forEach(year => {
            expect(year.totalStates).toBeGreaterThan(0);
            expect(year.coveragePercentage).toBeGreaterThanOrEqual(0);
            expect(year.coveragePercentage).toBeLessThanOrEqual(100);
          });
        });
      });
    });
  });

  describe('Year Completeness', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create data for multiple years
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2021,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2022,
          stateId: 1,
          statisticId: 1,
          value: 110.0
        },
        {
          importSessionId: 1,
          year: 2022,
          stateId: 2,
          statisticId: 1,
          value: 120.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 130.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 140.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 3,
          statisticId: 1,
          value: 150.0
        }
      ]);
    });

    it('should calculate year coverage correctly', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      report.categories.forEach(category => {
        category.metrics.forEach(metric => {
          metric.years.forEach(year => {
            expect(year.year).toBeGreaterThan(0);
            expect(year.totalStates).toBeGreaterThan(0);
            expect(year.productionStates).toBeGreaterThanOrEqual(0);
            expect(year.stagedStates).toBeGreaterThanOrEqual(0);
            expect(year.overlapStates).toBeGreaterThanOrEqual(0);
            expect(year.coveragePercentage).toBeGreaterThanOrEqual(0);
            expect(year.coveragePercentage).toBeLessThanOrEqual(100);
          });
        });
      });
    });

    it('should identify years with data', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      let foundYearWithData = false;
      
      report.categories.forEach(category => {
        category.metrics.forEach(metric => {
          metric.years.forEach(year => {
            if (year.productionStates > 0 || year.stagedStates > 0) {
              foundYearWithData = true;
              expect(year.coveragePercentage).toBeGreaterThan(0);
            }
          });
        });
      });
      
      expect(foundYearWithData).toBe(true);
    });
  });

  describe('Data Freshness Report', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create data with different timestamps
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2022,
          stateId: 1,
          statisticId: 1,
          value: 95.0
        }
      ]);
    });

    it('should generate data freshness report', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getDataFreshnessReport(db);
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('object');
    });
  });

  describe('Overlap Analysis', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create staged data that overlaps with production data
      await db.insert(csvImportStaging).values([
        {
          importId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 105.0,
          status: 'staged'
        }
      ]);
      
      // Create production data
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        }
      ]);
    });

    it('should generate overlap analysis', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getOverlapAnalysis(db);
      
      expect(report).toBeDefined();
      expect(typeof report).toBe('object');
    });
  });

  describe('Summary Calculations', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create comprehensive test data
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 150.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 2,
          value: 200.0
        }
      ]);
    });

    it('should calculate overall summary correctly', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      expect(report.summary.totalCategories).toBeGreaterThan(0);
      expect(report.summary.totalMetrics).toBeGreaterThan(0);
      expect(report.summary.totalStates).toBeGreaterThan(0);
      expect(report.summary.categoriesWithData).toBeGreaterThan(0);
      expect(report.summary.metricsWithData).toBeGreaterThan(0);
      expect(report.summary.overallCoveragePercentage).toBeGreaterThanOrEqual(0);
      expect(report.summary.overallCoveragePercentage).toBeLessThanOrEqual(100);
    });

    it('should handle empty data gracefully', async () => {
      const db = testDb.db;
      
      // Clear all data points
      await db.delete(dataPoints);
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      expect(report.summary.categoriesWithData).toBe(0);
      expect(report.summary.metricsWithData).toBe(0);
      expect(report.summary.overallCoveragePercentage).toBe(0);
    });
  });

  describe('Filter Combinations', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Create test data across multiple categories and years
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2022,
          stateId: 1,
          statisticId: 2,
          value: 200.0
        }
      ]);
    });

    it('should handle multiple filters', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({
        categoryId: 1,
        year: 2023,
        showIncompleteOnly: false
      }, db);
      
      expect(report).toBeDefined();
      expect(report.filters.categoryId).toBe(1);
      expect(report.filters.year).toBe(2023);
      expect(report.filters.showIncompleteOnly).toBe(false);
    });

    it('should handle invalid filters gracefully', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({
        categoryId: 999, // Non-existent category
        metricId: 999,   // Non-existent metric
        year: 1900       // Very old year
      }, db);
      
      expect(report).toBeDefined();
      // Should return empty results but not crash
      expect(report.categories.length).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle database instance parameter', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      expect(report).toBeDefined();
      expect(report.categories).toBeDefined();
    });

    it('should handle null filters', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport(null as any, db);
      
      expect(report).toBeDefined();
      expect(report.filters).toBeDefined();
    });

    it('should handle empty filters object', async () => {
      const db = testDb.db;
      
      const report = await DataCompletenessService.getCompletenessReport({}, db);
      
      expect(report).toBeDefined();
      expect(report.filters).toBeDefined();
    });
  });
}); 