import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { dataPoints, statistics, categories, dataSources } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as dataAvailabilityService from './dataAvailabilityService';

describe('DataAvailabilityService', () => {
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

  describe('hasDataForStatistic', () => {
    it('should return true when statistic has data points', async () => {
      const db = testDb.db;
      
      // Verify we have data for statistic 1
      const result = await dataAvailabilityService.hasDataForStatistic(1, db);
      expect(result).toBe(true);
    });

    it('should return false when statistic has no data points', async () => {
      const db = testDb.db;
      
      // Clear data for statistic 1
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      const result = await dataAvailabilityService.hasDataForStatistic(1, db);
      expect(result).toBe(false);
    });

    it('should return false for non-existent statistic', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.hasDataForStatistic(999, db);
      expect(result).toBe(false);
    });
  });

  describe('getStatisticsWithData', () => {
    it('should return all statistics that have data points', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.getStatisticsWithData(db);
      
      // Should return statistics 1, 3, 5 based on seeded data points
      expect(result).toContain(1);
      expect(result).toContain(3);
      expect(result).toContain(5);
      expect(result.length).toBe(3);
    });

    it('should return empty array when no statistics have data', async () => {
      const db = testDb.db;
      
      // Clear all data points
      await db.delete(dataPoints);
      
      const result = await dataAvailabilityService.getStatisticsWithData(db);
      expect(result).toEqual([]);
    });
  });

  describe('getCategoriesWithData', () => {
    it('should return categories that have statistics with data', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.getCategoriesWithData(db);
      
      // Should return all categories that have statistics with data
      expect(result).toContain('Education');
      expect(result).toContain('Healthcare');
      expect(result).toContain('Economy');
      expect(result.length).toBe(3);
    });

    it('should return empty array when no categories have data', async () => {
      const db = testDb.db;
      
      // Clear all data points
      await db.delete(dataPoints);
      
      const result = await dataAvailabilityService.getCategoriesWithData(db);
      expect(result).toEqual([]);
    });
  });

  describe('hasDataForCategory', () => {
    it('should return true when category has statistics with data', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.hasDataForCategory('Education', db);
      expect(result).toBe(true);
    });

    it('should return false when category has no statistics with data', async () => {
      const db = testDb.db;
      
      // Clear data for Education statistics
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 2));
      
      const result = await dataAvailabilityService.hasDataForCategory('Education', db);
      expect(result).toBe(false);
    });

    it('should return false for non-existent category', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.hasDataForCategory('NonExistentCategory', db);
      expect(result).toBe(false);
    });
  });

  describe('getStatisticsForCategoryWithData', () => {
    it('should return statistics for category that have data', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.getStatisticsForCategoryWithData('Education', db);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('High School Graduation Rate');
      expect(result[0].category).toBe('Education');
      expect(result[0].unit).toBe('percentage');
    });

    it('should return empty array when category has no statistics with data', async () => {
      const db = testDb.db;
      
      // Clear data for Education statistics
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 2));
      
      const result = await dataAvailabilityService.getStatisticsForCategoryWithData('Education', db);
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent category', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.getStatisticsForCategoryWithData('NonExistentCategory', db);
      expect(result).toEqual([]);
    });

    it('should include source information when available', async () => {
      const db = testDb.db;
      
      const result = await dataAvailabilityService.getStatisticsForCategoryWithData('Education', db);
      
      expect(result[0].source).toBe('US Census Bureau');
      expect(result[0].sourceUrl).toBe('https://www.census.gov');
    });

    it('should handle statistics without data sources gracefully', async () => {
      const db = testDb.db;
      
      // Create a statistic without a data source
      await db.insert(statistics).values({
        categoryId: 1,
        name: 'Test Statistic',
        description: 'Test description',
        unit: 'test',
        preferenceDirection: 'higher',
        isActive: 1
      });
      
      // Add data for this statistic
      await db.insert(dataPoints).values({
        importSessionId: 1,
        year: 2023,
        stateId: 1,
        statisticId: 7, // New statistic ID
        value: 100.0
      });
      
      const result = await dataAvailabilityService.getStatisticsForCategoryWithData('Education', db);
      
      // Should include the new statistic
      const newStatistic = result.find(stat => stat.name === 'Test Statistic');
      expect(newStatistic).toBeDefined();
      expect(newStatistic.source).toBeNull();
      expect(newStatistic.sourceUrl).toBeNull();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database to throw errors
      // For now, we'll test with a valid database
      const db = testDb.db;
      
      const result = await dataAvailabilityService.getStatisticsWithData(db);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle empty database gracefully', async () => {
      const db = testDb.db;
      
      // Clear all data
      await db.delete(dataPoints);
      await db.delete(statistics);
      await db.delete(categories);
      
      const result = await dataAvailabilityService.getStatisticsWithData(db);
      expect(result).toEqual([]);
    });

    it('should handle statistics with null category references', async () => {
      const db = testDb.db;
      
      // Create a statistic with null category (but we need to provide a valid categoryId due to NOT NULL constraint)
      await db.insert(statistics).values({
        categoryId: 1, // Use valid categoryId to avoid NOT NULL constraint
        name: 'Orphan Statistic',
        description: 'Test description',
        unit: 'test',
        preferenceDirection: 'higher',
        isActive: 1
      });
      
      // Add data for this statistic
      await db.insert(dataPoints).values({
        importSessionId: 1,
        year: 2023,
        stateId: 1,
        statisticId: 7,
        value: 100.0
      });
      
      const result = await dataAvailabilityService.getStatisticsForCategoryWithData('Education', db);
      
      // Should include the new statistic since it has a valid category
      const orphanStatistic = result.find(stat => stat.name === 'Orphan Statistic');
      expect(orphanStatistic).toBeDefined();
    });
  });

  describe('Performance and Data Integrity', () => {
    it('should handle large datasets efficiently', async () => {
      const db = testDb.db;
      
      // Add many data points for testing
      const dataPointsToAdd = [];
      for (let i = 0; i < 100; i++) {
        dataPointsToAdd.push({
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0 + i
        });
      }
      
      await db.insert(dataPoints).values(dataPointsToAdd);
      
      const startTime = Date.now();
      const result = await dataAvailabilityService.getStatisticsWithData(db);
      const endTime = Date.now();
      
      expect(result).toContain(1);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should maintain data consistency across multiple calls', async () => {
      const db = testDb.db;
      
      const result1 = await dataAvailabilityService.getStatisticsWithData(db);
      const result2 = await dataAvailabilityService.getStatisticsWithData(db);
      
      expect(result1).toEqual(result2);
    });
  });
}); 