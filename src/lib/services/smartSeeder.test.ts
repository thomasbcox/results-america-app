import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SmartSeeder, SeedingResult, SeedingSummary } from './smartSeeder';
import { getDb } from '@/lib/db';
import { states, categories, dataSources, statistics, dataPoints, importSessions, nationalAverages } from '@/lib/db/schema-postgres';

// Mock dependencies
jest.mock('@/lib/db');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

describe('SmartSeeder', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      onConflictDoNothing: jest.fn().mockReturnThis(),
      onConflictDoUpdate: jest.fn().mockReturnThis(),
    };

    mockGetDb.mockReturnValue(mockDb);

    // Setup default mock implementations
    mockDb.returning.mockResolvedValue([{ id: 1 }]);
    mockDb.from.mockResolvedValue([]);
    mockDb.where.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('seedAll', () => {
    it('should seed all tables in dependency order', async () => {
      // Mock successful seeding for all methods
      const mockResults: SeedingResult[] = [
        { table: 'states', created: 50, updated: 0, errors: [] },
        { table: 'categories', created: 10, updated: 0, errors: [] },
        { table: 'dataSources', created: 5, updated: 0, errors: [] },
        { table: 'statistics', created: 20, updated: 0, errors: [] },
        { table: 'dataPoints', created: 100, updated: 0, errors: [] },
        { table: 'nationalAverages', created: 10, updated: 0, errors: [] }
      ];

      // Mock each seeding method
      jest.spyOn(SmartSeeder, 'seedStates').mockResolvedValue(mockResults[0]);
      jest.spyOn(SmartSeeder, 'seedCategories').mockResolvedValue(mockResults[1]);
      jest.spyOn(SmartSeeder, 'seedDataSources').mockResolvedValue(mockResults[2]);
      jest.spyOn(SmartSeeder, 'seedStatistics').mockResolvedValue(mockResults[3]);
      jest.spyOn(SmartSeeder, 'seedDataPoints').mockResolvedValue(mockResults[4]);
      jest.spyOn(SmartSeeder, 'seedNationalAverages').mockResolvedValue(mockResults[5]);

      const summary = await SmartSeeder.seedAll();

      expect(summary.totalCreated).toBe(195);
      expect(summary.totalUpdated).toBe(0);
      expect(summary.totalErrors).toBe(0);
      expect(summary.results).toHaveLength(6);
      expect(summary.results[0].table).toBe('states');
      expect(summary.results[1].table).toBe('categories');
      expect(summary.results[2].table).toBe('dataSources');
      expect(summary.results[3].table).toBe('statistics');
      expect(summary.results[4].table).toBe('dataPoints');
      expect(summary.results[5].table).toBe('nationalAverages');
    });

    it('should handle errors in seeding methods', async () => {
      const mockResults: SeedingResult[] = [
        { table: 'states', created: 50, updated: 0, errors: [] },
        { table: 'categories', created: 10, updated: 0, errors: ['Category error'] },
        { table: 'dataSources', created: 5, updated: 0, errors: [] },
        { table: 'statistics', created: 20, updated: 0, errors: ['Statistic error'] },
        { table: 'dataPoints', created: 100, updated: 0, errors: [] },
        { table: 'nationalAverages', created: 10, updated: 0, errors: [] }
      ];

      jest.spyOn(SmartSeeder, 'seedStates').mockResolvedValue(mockResults[0]);
      jest.spyOn(SmartSeeder, 'seedCategories').mockResolvedValue(mockResults[1]);
      jest.spyOn(SmartSeeder, 'seedDataSources').mockResolvedValue(mockResults[2]);
      jest.spyOn(SmartSeeder, 'seedStatistics').mockResolvedValue(mockResults[3]);
      jest.spyOn(SmartSeeder, 'seedDataPoints').mockResolvedValue(mockResults[4]);
      jest.spyOn(SmartSeeder, 'seedNationalAverages').mockResolvedValue(mockResults[5]);

      const summary = await SmartSeeder.seedAll();

      expect(summary.totalErrors).toBe(2);
      expect(summary.results[1].errors).toContain('Category error');
      expect(summary.results[3].errors).toContain('Statistic error');
    });
  });

  describe('seedStates', () => {
    it('should seed all 50 US states plus Nation', async () => {
      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      const result = await SmartSeeder.seedStates();

      expect(result.table).toBe('states');
      expect(result.created).toBe(51); // 50 states + Nation
      expect(result.errors).toHaveLength(0);
      expect(mockDb.insert).toHaveBeenCalledWith(states);
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Alabama', abbreviation: 'AL' }),
          expect.objectContaining({ name: 'California', abbreviation: 'CA' }),
          expect.objectContaining({ name: 'Nation', abbreviation: 'NA' })
        ])
      );
    });

    it('should handle database errors', async () => {
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await SmartSeeder.seedStates();

      expect(result.errors).toContain('Database error');
      expect(result.created).toBe(0);
    });
  });

  describe('seedCategories', () => {
    it('should seed education categories', async () => {
      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      const result = await SmartSeeder.seedCategories();

      expect(result.table).toBe('categories');
      expect(result.created).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDb.insert).toHaveBeenCalledWith(categories);
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Education' }),
          expect.objectContaining({ name: 'Health' }),
          expect.objectContaining({ name: 'Economy' })
        ])
      );
    });

    it('should handle database errors', async () => {
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await SmartSeeder.seedCategories();

      expect(result.errors).toContain('Database error');
      expect(result.created).toBe(0);
    });
  });

  describe('seedDataSources', () => {
    it('should seed data sources', async () => {
      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      const result = await SmartSeeder.seedDataSources();

      expect(result.table).toBe('dataSources');
      expect(result.created).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDb.insert).toHaveBeenCalledWith(dataSources);
    });

    it('should handle database errors', async () => {
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await SmartSeeder.seedDataSources();

      expect(result.errors).toContain('Database error');
      expect(result.created).toBe(0);
    });
  });

  describe('seedStatistics', () => {
    it('should seed statistics with proper dependencies', async () => {
      // Mock existing categories and data sources
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Test Source' }]); // Data sources
      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      const result = await SmartSeeder.seedStatistics();

      expect(result.table).toBe('statistics');
      expect(result.created).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDb.insert).toHaveBeenCalledWith(statistics);
    });

    it('should handle missing dependencies', async () => {
      // Mock no existing categories
      mockDb.from.mockResolvedValueOnce([]); // No categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Test Source' }]); // Data sources

      const result = await SmartSeeder.seedStatistics();

      expect(result.errors).toContain('No categories found');
      expect(result.created).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Test Source' }]);
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await SmartSeeder.seedStatistics();

      expect(result.errors).toContain('Database error');
      expect(result.created).toBe(0);
    });
  });

  describe('seedDataPoints', () => {
    it('should seed data points with proper dependencies', async () => {
      // Mock existing dependencies
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]); // States
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Import session
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Data points

      const result = await SmartSeeder.seedDataPoints();

      expect(result.table).toBe('dataPoints');
      expect(result.created).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDb.insert).toHaveBeenCalledWith(dataPoints);
    });

    it('should handle missing dependencies', async () => {
      // Mock no existing states
      mockDb.from.mockResolvedValueOnce([]); // No states

      const result = await SmartSeeder.seedDataPoints();

      expect(result.errors).toContain('No states found');
      expect(result.created).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]);
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await SmartSeeder.seedDataPoints();

      expect(result.errors).toContain('Database error');
      expect(result.created).toBe(0);
    });
  });

  describe('seedNationalAverages', () => {
    it('should seed national averages', async () => {
      // Mock existing dependencies
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics
      mockDb.returning.mockResolvedValue([{ id: 1 }]);

      const result = await SmartSeeder.seedNationalAverages();

      expect(result.table).toBe('nationalAverages');
      expect(result.created).toBeGreaterThan(0);
      expect(result.errors).toHaveLength(0);
      expect(mockDb.insert).toHaveBeenCalledWith(nationalAverages);
    });

    it('should handle missing statistics', async () => {
      // Mock no existing statistics
      mockDb.from.mockResolvedValueOnce([]); // No statistics

      const result = await SmartSeeder.seedNationalAverages();

      expect(result.errors).toContain('No statistics found');
      expect(result.created).toBe(0);
    });

    it('should handle database errors', async () => {
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]);
      mockDb.returning.mockRejectedValue(new Error('Database error'));

      const result = await SmartSeeder.seedNationalAverages();

      expect(result.errors).toContain('Database error');
      expect(result.created).toBe(0);
    });
  });

  describe('getOrCreateImportSession', () => {
    it('should return existing import session', async () => {
      const mockSession = { id: 1, name: 'Test Session' };
      mockDb.from.mockResolvedValue([mockSession]);

      const sessionId = await SmartSeeder['getOrCreateImportSession']('Test Session');

      expect(sessionId).toBe(1);
    });

    it('should create new import session if none exists', async () => {
      mockDb.from.mockResolvedValue([]); // No existing session
      mockDb.returning.mockResolvedValue([{ id: 2 }]);

      const sessionId = await SmartSeeder['getOrCreateImportSession']('New Session');

      expect(sessionId).toBe(2);
      expect(mockDb.insert).toHaveBeenCalledWith(importSessions);
    });

    it('should handle database errors', async () => {
      mockDb.from.mockRejectedValue(new Error('Database error'));

      await expect(SmartSeeder['getOrCreateImportSession']('Test Session'))
        .rejects.toThrow('Database error');
    });
  });
}); 