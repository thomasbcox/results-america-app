import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { 
  states, 
  categories, 
  dataSources, 
  statistics, 
  importSessions, 
  dataPoints, 
  nationalAverages,
  users,
  sessions,
  magicLinks,
  userFavorites,
  userSuggestions
} from './schema';

describe('Database Schema Tests', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        importSessions: true,
        dataPoints: true,
        users: true,
        nationalAverages: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('Core Data Tables', () => {
    it('should have states table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(states).limit(1);
      expect(result).toBeDefined();
      
      // Check table structure by examining a record
      if (result.length > 0) {
        const state = result[0];
        expect(state).toHaveProperty('id');
        expect(state).toHaveProperty('name');
        expect(state).toHaveProperty('abbreviation');
        expect(state).toHaveProperty('isActive');
      }
    });

    it('should have categories table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(categories).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const category = result[0];
        expect(category).toHaveProperty('id');
        expect(category).toHaveProperty('name');
        expect(category).toHaveProperty('description');
        expect(category).toHaveProperty('icon');
        expect(category).toHaveProperty('sortOrder');
        expect(category).toHaveProperty('isActive');
      }
    });

    it('should have dataSources table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(dataSources).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const dataSource = result[0];
        expect(dataSource).toHaveProperty('id');
        expect(dataSource).toHaveProperty('name');
        expect(dataSource).toHaveProperty('description');
        expect(dataSource).toHaveProperty('url');
        expect(dataSource).toHaveProperty('isActive');
      }
    });

    it('should have statistics table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(statistics).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const statistic = result[0];
        expect(statistic).toHaveProperty('id');
        expect(statistic).toHaveProperty('raNumber');
        expect(statistic).toHaveProperty('categoryId');
        expect(statistic).toHaveProperty('dataSourceId');
        expect(statistic).toHaveProperty('name');
        expect(statistic).toHaveProperty('description');
        expect(statistic).toHaveProperty('subMeasure');
        expect(statistic).toHaveProperty('calculation');
        expect(statistic).toHaveProperty('unit');
        expect(statistic).toHaveProperty('availableSince');
        expect(statistic).toHaveProperty('dataQuality');
        expect(statistic).toHaveProperty('provenance');
        expect(statistic).toHaveProperty('isActive');
      }
    });

    it('should have importSessions table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(importSessions).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const session = result[0];
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('name');
        expect(session).toHaveProperty('description');
        expect(session).toHaveProperty('dataSourceId');
        expect(session).toHaveProperty('importDate');
        expect(session).toHaveProperty('dataYear');
        expect(session).toHaveProperty('recordCount');
        expect(session).toHaveProperty('isActive');
      }
    });

    it('should have dataPoints table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(dataPoints).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const dataPoint = result[0];
        expect(dataPoint).toHaveProperty('id');
        expect(dataPoint).toHaveProperty('importSessionId');
        expect(dataPoint).toHaveProperty('year');
        expect(dataPoint).toHaveProperty('stateId');
        expect(dataPoint).toHaveProperty('statisticId');
        expect(dataPoint).toHaveProperty('value');
      }
    });

    it('should have nationalAverages table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(nationalAverages).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const average = result[0];
        expect(average).toHaveProperty('id');
        expect(average).toHaveProperty('statisticId');
        expect(average).toHaveProperty('year');
        expect(average).toHaveProperty('value');
        expect(average).toHaveProperty('calculationMethod');
        expect(average).toHaveProperty('stateCount');
        expect(average).toHaveProperty('lastCalculated');
      }
    });
  });

  describe('User Authentication Tables', () => {
    it('should have users table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(users).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const user = result[0];
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('role');
        expect(user).toHaveProperty('isActive');
        expect(user).toHaveProperty('emailVerified');
        expect(user).toHaveProperty('createdAt');
        expect(user).toHaveProperty('updatedAt');
      }
    });

    it('should have sessions table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(sessions).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const session = result[0];
        expect(session).toHaveProperty('id');
        expect(session).toHaveProperty('userId');
        expect(session).toHaveProperty('token');
        expect(session).toHaveProperty('expiresAt');
        expect(session).toHaveProperty('createdAt');
      }
    });

    it('should have magicLinks table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(magicLinks).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const magicLink = result[0];
        expect(magicLink).toHaveProperty('id');
        expect(magicLink).toHaveProperty('email');
        expect(magicLink).toHaveProperty('token');
        expect(magicLink).toHaveProperty('expiresAt');
        expect(magicLink).toHaveProperty('used');
        expect(magicLink).toHaveProperty('createdAt');
      }
    });
  });

  describe('User Preferences Tables', () => {
    it('should have userFavorites table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(userFavorites).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const favorite = result[0];
        expect(favorite).toHaveProperty('id');
        expect(favorite).toHaveProperty('userId');
        expect(favorite).toHaveProperty('statisticId');
        expect(favorite).toHaveProperty('createdAt');
      }
    });

    it('should have userSuggestions table with correct structure', async () => {
      const db = testDb.db;
      const result = await db.select().from(userSuggestions).limit(1);
      expect(result).toBeDefined();
      
      if (result.length > 0) {
        const suggestion = result[0];
        expect(suggestion).toHaveProperty('id');
        expect(suggestion).toHaveProperty('userId');
        expect(suggestion).toHaveProperty('title');
        expect(suggestion).toHaveProperty('description');
        expect(suggestion).toHaveProperty('category');
        expect(suggestion).toHaveProperty('status');
        expect(suggestion).toHaveProperty('adminNotes');
        expect(suggestion).toHaveProperty('createdAt');
        expect(suggestion).toHaveProperty('updatedAt');
      }
    });
  });

  describe('Table Relationships', () => {
    it('should have proper foreign key relationships', async () => {
      const db = testDb.db;
      
      // Test statistics -> categories relationship
      const statsWithCategories = await db
        .select({
          statisticId: statistics.id,
          statisticName: statistics.name,
          categoryId: statistics.categoryId,
          categoryName: categories.name
        })
        .from(statistics)
        .leftJoin(categories, statistics.categoryId.eq(categories.id))
        .limit(5);
      
      expect(statsWithCategories).toBeDefined();
      expect(statsWithCategories.length).toBeGreaterThan(0);
      
      // Test dataPoints -> statistics relationship
      const dataPointsWithStats = await db
        .select({
          dataPointId: dataPoints.id,
          statisticId: dataPoints.statisticId,
          statisticName: statistics.name,
          value: dataPoints.value
        })
        .from(dataPoints)
        .leftJoin(statistics, dataPoints.statisticId.eq(statistics.id))
        .limit(5);
      
      expect(dataPointsWithStats).toBeDefined();
      expect(dataPointsWithStats.length).toBeGreaterThan(0);
    });

    it('should have proper unique constraints', async () => {
      const db = testDb.db;
      
      // Test states unique constraint
      const stateNames = await db.select({ name: states.name }).from(states);
      const uniqueNames = new Set(stateNames.map(s => s.name));
      expect(uniqueNames.size).toBe(stateNames.length);
      
      // Test categories unique constraint
      const categoryNames = await db.select({ name: categories.name }).from(categories);
      const uniqueCategoryNames = new Set(categoryNames.map(c => c.name));
      expect(uniqueCategoryNames.size).toBe(categoryNames.length);
    });
  });

  describe('Data Integrity', () => {
    it('should have valid data in all tables', async () => {
      const db = testDb.db;
      const tableCounts = {
        states: await db.select().from(states).then(r => r.length),
        categories: await db.select().from(categories).then(r => r.length),
        dataSources: await db.select().from(dataSources).then(r => r.length),
        statistics: await db.select().from(statistics).then(r => r.length),
        importSessions: await db.select().from(importSessions).then(r => r.length),
        dataPoints: await db.select().from(dataPoints).then(r => r.length),
        users: await db.select().from(users).then(r => r.length),
        sessions: await db.select().from(sessions).then(r => r.length),
        magicLinks: await db.select().from(magicLinks).then(r => r.length),
        userFavorites: await db.select().from(userFavorites).then(r => r.length),
        userSuggestions: await db.select().from(userSuggestions).then(r => r.length),
        nationalAverages: await db.select().from(nationalAverages).then(r => r.length)
      };
      
      // Verify all tables have data
      expect(tableCounts.states).toBeGreaterThan(0);
      expect(tableCounts.categories).toBeGreaterThan(0);
      expect(tableCounts.dataSources).toBeGreaterThan(0);
      expect(tableCounts.statistics).toBeGreaterThan(0);
      expect(tableCounts.importSessions).toBeGreaterThan(0);
      expect(tableCounts.dataPoints).toBeGreaterThan(0);
      
      console.log('Table record counts:', tableCounts);
    });

    it('should have valid foreign key references', async () => {
      const db = testDb.db;
      
      // Test that all statistics have valid category references
      const invalidStats = await db
        .select()
        .from(statistics)
        .leftJoin(categories, statistics.categoryId.eq(categories.id))
        .where(categories.id.isNull());
      
      expect(invalidStats.length).toBe(0);
      
      // Test that all dataPoints have valid statistic references
      const invalidDataPoints = await db
        .select()
        .from(dataPoints)
        .leftJoin(statistics, dataPoints.statisticId.eq(statistics.id))
        .where(statistics.id.isNull());
      
      expect(invalidDataPoints.length).toBe(0);
    });
  });
}); 