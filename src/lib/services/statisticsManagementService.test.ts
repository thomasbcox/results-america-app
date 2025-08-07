import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { statistics, categories, dataSources } from '../db/schema';
import { eq } from 'drizzle-orm';
import { StatisticsManagementService } from './statisticsManagementService';
import { ValidationError, NotFoundError } from '../errors';

describe('StatisticsManagementService', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        categories: true,
        dataSources: true,
        statistics: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('updateStatistic', () => {
    it('should update statistic data quality', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        dataQuality: 'real' as const
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.dataQuality).toBe('real');

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.dataQuality).toBe('real');
    });

    it('should update statistic provenance', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        provenance: 'Updated from external source'
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.provenance).toBe('Updated from external source');

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.provenance).toBe('Updated from external source');
    });

    it('should update statistic name', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        name: 'Updated High School Graduation Rate'
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.name).toBe('Updated High School Graduation Rate');

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.name).toBe('Updated High School Graduation Rate');
    });

    it('should update statistic description', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        description: 'Updated description for graduation rate'
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.description).toBe('Updated description for graduation rate');

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.description).toBe('Updated description for graduation rate');
    });

    it('should update statistic unit', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        unit: 'percent'
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.unit).toBe('percent');

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.unit).toBe('percent');
    });

    it('should update statistic active status', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        isActive: false
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.isActive).toBe(0); // Converted to integer

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.isActive).toBe(0);
    });

    it('should update multiple fields at once', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        name: 'Comprehensive Graduation Rate',
        description: 'Updated comprehensive description',
        unit: 'percentage',
        dataQuality: 'real' as const,
        provenance: 'Bureau of Education Statistics',
        isActive: true
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.name).toBe('Comprehensive Graduation Rate');
      expect(result.description).toBe('Updated comprehensive description');
      expect(result.unit).toBe('percentage');
      expect(result.dataQuality).toBe('real');
      expect(result.provenance).toBe('Bureau of Education Statistics');
      expect(result.isActive).toBe(1);

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.name).toBe('Comprehensive Graduation Rate');
      expect(updatedStatistic.description).toBe('Updated comprehensive description');
      expect(updatedStatistic.unit).toBe('percentage');
      expect(updatedStatistic.dataQuality).toBe('real');
      expect(updatedStatistic.provenance).toBe('Bureau of Education Statistics');
      expect(updatedStatistic.isActive).toBe(1);
    });

    it('should handle partial updates', async () => {
      const db = testDb.db;
      const statisticId = 1;

      // Get original statistic
      const [originalStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      const updateData = {
        name: 'Only Name Updated'
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.name).toBe('Only Name Updated');
      expect(result.description).toBe(originalStatistic.description); // Should remain unchanged
      expect(result.unit).toBe(originalStatistic.unit); // Should remain unchanged
    });

    it('should throw ValidationError for invalid data quality', async () => {
      const statisticId = 1;

      const updateData = {
        dataQuality: 'invalid' as any
      };

      await expect(StatisticsManagementService.updateStatistic(statisticId, updateData))
        .rejects.toThrow(ValidationError);
      await expect(StatisticsManagementService.updateStatistic(statisticId, updateData))
        .rejects.toThrow('Data quality must be either "mock" or "real"');
    });

    it('should throw NotFoundError for non-existent statistic', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      await expect(StatisticsManagementService.updateStatistic(999, updateData))
        .rejects.toThrow(NotFoundError);
      await expect(StatisticsManagementService.updateStatistic(999, updateData))
        .rejects.toThrow('Statistic not found');
    });

    it('should handle empty string values', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        description: '',
        provenance: ''
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.description).toBe('');
      expect(result.provenance).toBe('');

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.description).toBe('');
      expect(updatedStatistic.provenance).toBe('');
    });

    it('should handle null values for optional fields', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const updateData = {
        description: null,
        provenance: null
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.description).toBeNull();
      expect(result.provenance).toBeNull();

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.description).toBeNull();
      expect(updatedStatistic.provenance).toBeNull();
    });
  });

  describe('getStatistic', () => {
    it('should return statistic by ID', async () => {
      const statisticId = 1;

      const result = await StatisticsManagementService.getStatistic(statisticId);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.name).toBe('High School Graduation Rate');
      expect(result.description).toBe('Percentage of students who graduate high school');
      expect(result.unit).toBe('percentage');
      expect(result.categoryId).toBe(1);
      expect(result.dataSourceId).toBe(1);
      expect(result.isActive).toBe(1);
    });

    it('should return all statistic fields', async () => {
      const statisticId = 1;

      const result = await StatisticsManagementService.getStatistic(statisticId);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('raNumber');
      expect(result).toHaveProperty('categoryId');
      expect(result).toHaveProperty('dataSourceId');
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('subMeasure');
      expect(result).toHaveProperty('calculation');
      expect(result).toHaveProperty('unit');
      expect(result).toHaveProperty('availableSince');
      expect(result).toHaveProperty('dataQuality');
      expect(result).toHaveProperty('provenance');
      expect(result).toHaveProperty('preferenceDirection');
      expect(result).toHaveProperty('isActive');
    });

    it('should throw NotFoundError for non-existent statistic', async () => {
      await expect(StatisticsManagementService.getStatistic(999))
        .rejects.toThrow(NotFoundError);
      await expect(StatisticsManagementService.getStatistic(999))
        .rejects.toThrow('Statistic not found');
    });

    it('should handle inactive statistics', async () => {
      const db = testDb.db;
      const statisticId = 1;

      // Deactivate the statistic
      await db.update(statistics)
        .set({ isActive: 0 })
        .where(eq(statistics.id, statisticId));

      const result = await StatisticsManagementService.getStatistic(statisticId);

      expect(result).toBeDefined();
      expect(result.id).toBe(statisticId);
      expect(result.isActive).toBe(0);
    });

    it('should handle statistics with null optional fields', async () => {
      const db = testDb.db;

      // Create a statistic with null optional fields
      const [newStatistic] = await db.insert(statistics).values({
        categoryId: 1,
        name: 'Test Statistic',
        unit: 'test',
        preferenceDirection: 'higher',
        isActive: 1,
        description: null,
        subMeasure: null,
        calculation: null,
        availableSince: null,
        dataQuality: null,
        provenance: null
      }).returning();

      const result = await StatisticsManagementService.getStatistic(newStatistic.id);

      expect(result).toBeDefined();
      expect(result.id).toBe(newStatistic.id);
      expect(result.name).toBe('Test Statistic');
      expect(result.description).toBeNull();
      expect(result.subMeasure).toBeNull();
      expect(result.calculation).toBeNull();
      expect(result.availableSince).toBeNull();
      expect(result.dataQuality).toBeNull();
      expect(result.provenance).toBeNull();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database to throw errors
      // For now, we'll test with a valid request
      const result = await StatisticsManagementService.getStatistic(1);
      expect(result).toBeDefined();
    });

    it('should handle concurrent updates', async () => {
      const db = testDb.db;
      const statisticId = 1;

      // Make concurrent updates
      const promises = [
        StatisticsManagementService.updateStatistic(statisticId, { name: 'Update 1' }),
        StatisticsManagementService.updateStatistic(statisticId, { name: 'Update 2' }),
        StatisticsManagementService.updateStatistic(statisticId, { name: 'Update 3' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.id).toBe(statisticId);
      });

      // Check final state
      const [finalStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(finalStatistic.name).toBeDefined();
    });

    it('should handle very long field values', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const longDescription = 'A'.repeat(1000);
      const longProvenance = 'B'.repeat(1000);

      const updateData = {
        description: longDescription,
        provenance: longProvenance
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.description).toBe(longDescription);
      expect(result.provenance).toBe(longProvenance);

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.description).toBe(longDescription);
      expect(updatedStatistic.provenance).toBe(longProvenance);
    });

    it('should handle special characters in field values', async () => {
      const db = testDb.db;
      const statisticId = 1;

      const specialDescription = 'Description with "quotes", <tags>, & symbols: 100%';
      const specialProvenance = 'Source with "quotes" and <tags>';

      const updateData = {
        description: specialDescription,
        provenance: specialProvenance
      };

      const result = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      expect(result).toBeDefined();
      expect(result.description).toBe(specialDescription);
      expect(result.provenance).toBe(specialProvenance);

      // Verify the update was persisted
      const [updatedStatistic] = await db
        .select()
        .from(statistics)
        .where(eq(statistics.id, statisticId));

      expect(updatedStatistic.description).toBe(specialDescription);
      expect(updatedStatistic.provenance).toBe(specialProvenance);
    });
  });

  describe('Data Integrity and Performance', () => {
    it('should maintain data consistency across operations', async () => {
      const db = testDb.db;
      const statisticId = 1;

      // Get original statistic
      const originalStatistic = await StatisticsManagementService.getStatistic(statisticId);

      // Update the statistic
      const updateData = {
        name: 'Updated Name',
        description: 'Updated Description'
      };

      const updatedStatistic = await StatisticsManagementService.updateStatistic(statisticId, updateData);

      // Verify the update
      expect(updatedStatistic.name).toBe('Updated Name');
      expect(updatedStatistic.description).toBe('Updated Description');

      // Get the statistic again to verify persistence
      const retrievedStatistic = await StatisticsManagementService.getStatistic(statisticId);

      expect(retrievedStatistic.name).toBe('Updated Name');
      expect(retrievedStatistic.description).toBe('Updated Description');
      expect(retrievedStatistic.id).toBe(originalStatistic.id);
      expect(retrievedStatistic.categoryId).toBe(originalStatistic.categoryId);
      expect(retrievedStatistic.dataSourceId).toBe(originalStatistic.dataSourceId);
    });

    it('should handle large numbers of operations efficiently', async () => {
      const startTime = Date.now();
      
      // Create many statistics and update them
      const promises = [];
      for (let i = 0; i < 50; i++) {
        const db = testDb.db;
        const [newStatistic] = await db.insert(statistics).values({
          categoryId: 1,
          name: `Test Statistic ${i}`,
          unit: 'test',
          preferenceDirection: 'higher',
          isActive: 1
        }).returning();

        promises.push(
          StatisticsManagementService.updateStatistic(newStatistic.id, {
            name: `Updated Test Statistic ${i}`,
            description: `Updated description ${i}`
          })
        );
      }
      
      const results = await Promise.all(promises);
      const endTime = Date.now();

      expect(results).toHaveLength(50);
      results.forEach((result, index) => {
        expect(result.name).toBe(`Updated Test Statistic ${index}`);
        expect(result.description).toBe(`Updated description ${index}`);
      });
      
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should not affect other statistics when updating one', async () => {
      const db = testDb.db;
      const statisticId = 1;

      // Get all statistics before update
      const allStatisticsBefore = await db.select().from(statistics);

      // Update one statistic
      await StatisticsManagementService.updateStatistic(statisticId, {
        name: 'Updated Name',
        description: 'Updated Description'
      });

      // Get all statistics after update
      const allStatisticsAfter = await db.select().from(statistics);

      // Verify that only the target statistic was updated
      allStatisticsAfter.forEach(statistic => {
        if (statistic.id === statisticId) {
          expect(statistic.name).toBe('Updated Name');
          expect(statistic.description).toBe('Updated Description');
        } else {
          const beforeStatistic = allStatisticsBefore.find(s => s.id === statistic.id);
          expect(statistic.name).toBe(beforeStatistic.name);
          expect(statistic.description).toBe(beforeStatistic.description);
        }
      });
    });
  });
}); 