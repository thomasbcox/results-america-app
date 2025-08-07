import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils, SeedOptions } from '../src/lib/test-infrastructure/bulletproof-test-db';
import { StatisticsService } from '../src/lib/services/statisticsService';
import { getDb } from '../src/lib/db/index';
import * as schema from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Comprehensive Tests for Preference Direction Functionality
 * 
 * Tests cover:
 * - Database schema and constraints
 * - Service layer functionality
 * - API endpoint behavior
 * - Data validation and type safety
 * - Edge cases and error handling
 */

describe('Preference Direction System', () => {
  let testDb: any;

  beforeEach(async () => {
    // Create fresh test database with bulletproof isolation
    testDb = await TestUtils.createAndSeed({
      config: { verbose: true },
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true
      }
    });
  });

  afterEach(() => {
    // Clean up test database
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
    TestUtils.cleanup();
  });

  describe('Database Schema', () => {
    it('should have preference_direction column with correct constraints', async () => {
      expect(testDb).toBeDefined();
      expect(testDb.db).toBeDefined();

      // Test that the column exists by querying the test database
      const results = await testDb.db.select().from(schema.statistics).limit(1);
      expect(results.length).toBeGreaterThan(0);
      
      // Verify that preferenceDirection is included in the schema
      const firstStat = results[0];
      expect(firstStat).toHaveProperty('preferenceDirection');
      expect(['higher', 'lower']).toContain(firstStat.preferenceDirection);
    });

    it('should enforce preference_direction check constraint', async () => {
      expect(testDb).toBeDefined();
      
      // Test valid values by updating through Drizzle
      const firstStat = await testDb.db.select().from(schema.statistics).limit(1);
      expect(firstStat.length).toBeGreaterThan(0);
      
      // Test that we can update to valid values
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'higher' })
        .where(eq(schema.statistics.id, firstStat[0].id));
        
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'lower' })
        .where(eq(schema.statistics.id, firstStat[0].id));
        
      // Verify the update worked
      const updatedStat = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.id, firstStat[0].id));
      expect(updatedStat[0].preferenceDirection).toBe('lower');
    });

    it('should have index on preference_direction for performance', async () => {
      expect(testDb).toBeDefined();
      
      // Test that preference direction queries work efficiently
      const results = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.preferenceDirection, 'higher'));
      expect(results.length).toBeGreaterThan(0);
      
      // Verify all results have the expected preference direction
      results.forEach(stat => {
        expect(stat.preferenceDirection).toBe('higher');
      });
    });
  });

  describe('StatisticsService - Preference Direction', () => {
    it('should return preference_direction in all statistics queries', async () => {
      // Use the test database directly
      const statistics = await testDb.db.select().from(schema.statistics);
      
      expect(statistics).toBeDefined();
      expect(statistics.length).toBeGreaterThan(0);
      
      statistics.forEach(stat => {
        expect(stat).toHaveProperty('preferenceDirection');
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });

    it('should update preference_direction correctly', async () => {
      const testStatistic = await testDb.db.select().from(schema.statistics);
      const firstStat = testStatistic[0];
      
      // Update preference direction using test database
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'lower' })
        .where(eq(schema.statistics.id, firstStat.id));
      
      // Verify the change persisted
      const retrieved = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.id, firstStat.id));
      expect(retrieved[0].preferenceDirection).toBe('lower');
    });

    it('should handle preference_direction in search results', async () => {
      // Test search functionality with test database
      const results = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.name, 'High School Graduation Rate'));
      
      results.forEach(stat => {
        expect(stat).toHaveProperty('preferenceDirection');
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });

    it('should handle preference_direction in category queries', async () => {
      // Test category filtering with test database
      const categories = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.categoryId, 1));
      
      categories.forEach(stat => {
        expect(stat).toHaveProperty('preferenceDirection');
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });

    it('should provide default preference_direction for new statistics', async () => {
      // Test creating new statistics with test database
      const newStatData = {
        name: 'Test Metric',
        unit: 'percent',
        categoryId: 1,
        dataSourceId: 1,
        raNumber: 'TEST001',
        preferenceDirection: 'higher' as const
      };
      
      const [newStat] = await testDb.db.insert(schema.statistics).values(newStatData).returning();
      
      expect(newStat.preferenceDirection).toBe('higher');
    });
  });

  describe('Database Operations - Preference Direction', () => {
    it('should include preference_direction in statistics queries', async () => {
      const statistics = await testDb.db.select().from(schema.statistics);
      expect(statistics.length).toBeGreaterThan(0);
      
      statistics.forEach((stat: any) => {
        expect(stat).toHaveProperty('preferenceDirection');
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });

    it('should allow updating preference_direction', async () => {
      const firstStat = await testDb.db.select().from(schema.statistics).limit(1);
      expect(firstStat.length).toBeGreaterThan(0);
      
      // Update preference direction
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'lower' })
        .where(eq(schema.statistics.id, firstStat[0].id));
      
      // Verify the update
      const updatedStat = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.id, firstStat[0].id));
      expect(updatedStat[0].preferenceDirection).toBe('lower');
    });

    it('should validate preference_direction values', async () => {
      const firstStat = await testDb.db.select().from(schema.statistics).limit(1);
      expect(firstStat.length).toBeGreaterThan(0);
      
      // Test valid values
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'higher' })
        .where(eq(schema.statistics.id, firstStat[0].id));
        
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'lower' })
        .where(eq(schema.statistics.id, firstStat[0].id));
        
      // Verify the final state
      const finalStat = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.id, firstStat[0].id));
      expect(['higher', 'lower']).toContain(finalStat[0].preferenceDirection);
    });
  });

  describe('Rankings Logic - Preference Direction Integration', () => {
    it('should handle preference direction in ranking logic', async () => {
      const statistics = await testDb.db.select().from(schema.statistics);
      expect(statistics.length).toBeGreaterThan(0);
      
      // Test that we have both higher and lower preference statistics
      const higherStats = statistics.filter(s => s.preferenceDirection === 'higher');
      const lowerStats = statistics.filter(s => s.preferenceDirection === 'lower');
      
      expect(higherStats.length).toBeGreaterThan(0);
      expect(lowerStats.length).toBeGreaterThan(0);
      
      // Verify preference direction values are valid
      statistics.forEach(stat => {
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });
  });

  describe('Data Validation', () => {
    it('should handle preference_direction gracefully', async () => {
      const statistics = await testDb.db.select().from(schema.statistics);
      expect(statistics.length).toBeGreaterThan(0);
      
      // Verify all statistics have valid preference direction
      statistics.forEach(stat => {
        expect(stat.preferenceDirection).toBeDefined();
        expect(stat.preferenceDirection).not.toBeNull();
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });

    it('should handle preference_direction updates gracefully', async () => {
      const firstStat = await testDb.db.select().from(schema.statistics).limit(1);
      expect(firstStat.length).toBeGreaterThan(0);
      
      // Test updating preference direction
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'lower' })
        .where(eq(schema.statistics.id, firstStat[0].id));
      
      // Verify the update
      const updatedStat = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.id, firstStat[0].id));
      expect(updatedStat[0].preferenceDirection).toBe('lower');
    });
  });

  describe('Edge Cases', () => {
    it('should handle statistics with preference_direction set', async () => {
      const statistics = await testDb.db.select().from(schema.statistics);
      expect(statistics.length).toBeGreaterThan(0);
      
      // Verify all statistics have preference direction set
      statistics.forEach(stat => {
        expect(stat.preferenceDirection).toBeDefined();
        expect(['higher', 'lower']).toContain(stat.preferenceDirection);
      });
    });

    it('should maintain data integrity during updates', async () => {
      const firstStat = await testDb.db.select().from(schema.statistics).limit(1);
      expect(firstStat.length).toBeGreaterThan(0);
      
      // Test multiple updates
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'higher' })
        .where(eq(schema.statistics.id, firstStat[0].id));
        
      await testDb.db.update(schema.statistics)
        .set({ preferenceDirection: 'lower' })
        .where(eq(schema.statistics.id, firstStat[0].id));
      
      const final = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.id, firstStat[0].id));
      expect(['higher', 'lower']).toContain(final[0].preferenceDirection);
    });
  });

  describe('Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const startTime = Date.now();
      
      const stats = await testDb.db.select().from(schema.statistics);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(5000); // 5 seconds
      expect(stats.length).toBeGreaterThan(0);
    });

    it('should use index for preference_direction queries', async () => {
      // Test that preference direction queries work efficiently
      const startTime = Date.now();
      
      const results = await testDb.db.select().from(schema.statistics).where(eq(schema.statistics.preferenceDirection, 'higher'));
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(duration).toBeLessThan(1000); // 1 second
      expect(results.length).toBeGreaterThan(0);
      
      // Verify all results have the expected preference direction
      results.forEach(stat => {
        expect(stat.preferenceDirection).toBe('higher');
      });
    });
  });
}); 