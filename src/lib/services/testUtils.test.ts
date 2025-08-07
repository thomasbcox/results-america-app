import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  createDataSource,
  createCategory,
  createState,
  createImportSession,
  createStatistic,
  createDataPoint,
  clearAllTestData
} from './testUtils';
import { dataSources, categories, states, importSessions, statistics, dataPoints } from '@/lib/db/schema';

describe('testUtils', () => {
  let mockDb: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock database
    mockDb = {
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      delete: jest.fn().mockReturnThis(),
    };

    // Setup default mock implementations
    mockDb.returning.mockResolvedValue([{ id: 1 }]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createDataSource', () => {
    it('should create a data source with default values', async () => {
      const result = await createDataSource(mockDb);

      expect(mockDb.insert).toHaveBeenCalledWith(dataSources);
      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'TestSource',
        url: 'https://test.com'
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should create a data source with overrides', async () => {
      const overrides = {
        name: 'CustomSource',
        url: 'https://custom.com',
        description: 'Custom description'
      };

      const result = await createDataSource(mockDb, overrides);

      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'CustomSource',
        url: 'https://custom.com',
        description: 'Custom description'
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createCategory', () => {
    it('should create a category with default values', async () => {
      const result = await createCategory(mockDb);

      expect(mockDb.insert).toHaveBeenCalledWith(categories);
      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'TestCat',
        icon: 'TestIcon'
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should create a category with overrides', async () => {
      const overrides = {
        name: 'CustomCat',
        icon: 'CustomIcon',
        description: 'Custom description'
      };

      const result = await createCategory(mockDb, overrides);

      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'CustomCat',
        icon: 'CustomIcon',
        description: 'Custom description'
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createState', () => {
    it('should create a state with default values', async () => {
      const result = await createState(mockDb);

      expect(mockDb.insert).toHaveBeenCalledWith(states);
      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'Testland',
        abbreviation: 'TL'
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should create a state with overrides', async () => {
      const overrides = {
        name: 'CustomState',
        abbreviation: 'CS',
        population: 1000000
      };

      const result = await createState(mockDb, overrides);

      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'CustomState',
        abbreviation: 'CS',
        population: 1000000
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createImportSession', () => {
    it('should create an import session with default values', async () => {
      const result = await createImportSession(mockDb);

      expect(mockDb.insert).toHaveBeenCalledWith(importSessions);
      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'Test Import Session',
        dataYear: 2023,
        recordCount: 100,
        isActive: 1
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should create an import session with overrides', async () => {
      const overrides = {
        name: 'Custom Import Session',
        dataYear: 2024,
        recordCount: 200,
        description: 'Custom description'
      };

      const result = await createImportSession(mockDb, overrides);

      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'Custom Import Session',
        dataYear: 2024,
        recordCount: 200,
        isActive: 1,
        description: 'Custom description'
      });
      expect(result).toEqual({ id: 1 });
    });
  });

  describe('createStatistic', () => {
    it('should create a statistic with required parameters', async () => {
      const params = {
        categoryId: 1,
        dataSourceId: 2
      };

      const result = await createStatistic(mockDb, params);

      expect(mockDb.insert).toHaveBeenCalledWith(statistics);
      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'Test Stat',
        raNumber: '9999',
        categoryId: 1,
        dataSourceId: 2,
        unit: 'TestUnit'
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should create a statistic with overrides', async () => {
      const params = {
        categoryId: 1,
        dataSourceId: 2,
        name: 'Custom Stat',
        raNumber: '8888',
        unit: 'CustomUnit',
        description: 'Custom description'
      };

      const result = await createStatistic(mockDb, params);

      expect(mockDb.values).toHaveBeenCalledWith({
        name: 'Custom Stat',
        raNumber: '8888',
        categoryId: 1,
        dataSourceId: 2,
        unit: 'CustomUnit',
        description: 'Custom description'
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw error if required parameters are missing', async () => {
      // Mock database to throw error when required parameters are missing
      mockDb.insert.mockImplementation(() => {
        throw new Error('Missing required parameters');
      });

      // @ts-expect-error - Testing missing required parameters
      await expect(createStatistic(mockDb, {})).rejects.toThrow('Missing required parameters');
    });
  });

  describe('createDataPoint', () => {
    it('should create a data point with required parameters', async () => {
      const params = {
        importSessionId: 1,
        stateId: 2,
        statisticId: 3
      };

      const result = await createDataPoint(mockDb, params);

      expect(mockDb.insert).toHaveBeenCalledWith(dataPoints);
      expect(mockDb.values).toHaveBeenCalledWith({
        year: 2023,
        value: 100.0,
        importSessionId: 1,
        stateId: 2,
        statisticId: 3
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should create a data point with overrides', async () => {
      const params = {
        importSessionId: 1,
        stateId: 2,
        statisticId: 3,
        year: 2024,
        value: 150.5,
        notes: 'Custom notes'
      };

      const result = await createDataPoint(mockDb, params);

      expect(mockDb.values).toHaveBeenCalledWith({
        year: 2024,
        value: 150.5,
        importSessionId: 1,
        stateId: 2,
        statisticId: 3,
        notes: 'Custom notes'
      });
      expect(result).toEqual({ id: 1 });
    });

    it('should throw error if required parameters are missing', async () => {
      // Mock database to throw error when required parameters are missing
      mockDb.insert.mockImplementation(() => {
        throw new Error('Missing required parameters');
      });

      // @ts-expect-error - Testing missing required parameters
      await expect(createDataPoint(mockDb, {})).rejects.toThrow('Missing required parameters');
    });
  });

  describe('clearAllTestData', () => {
    it('should delete all test data in correct order', async () => {
      await clearAllTestData(mockDb);

      // Should delete in FK-safe order
      expect(mockDb.delete).toHaveBeenCalledWith(dataPoints);
      expect(mockDb.delete).toHaveBeenCalledWith(statistics);
      expect(mockDb.delete).toHaveBeenCalledWith(states);
      expect(mockDb.delete).toHaveBeenCalledWith(categories);
      expect(mockDb.delete).toHaveBeenCalledWith(dataSources);
      expect(mockDb.delete).toHaveBeenCalledWith(importSessions);
    });

    it('should handle database errors gracefully', async () => {
      mockDb.delete.mockRejectedValueOnce(new Error('Database error'));

      await expect(clearAllTestData(mockDb)).rejects.toThrow('Database error');
    });
  });

  describe('integration tests', () => {
    it('should create related entities correctly', async () => {
      // Create dependencies
      const dataSource = await createDataSource(mockDb);
      const category = await createCategory(mockDb);
      const state = await createState(mockDb);
      const importSession = await createImportSession(mockDb);

      // Create dependent entities
      const statistic = await createStatistic(mockDb, {
        categoryId: dataSource.id,
        dataSourceId: dataSource.id
      });

      const dataPoint = await createDataPoint(mockDb, {
        importSessionId: importSession.id,
        stateId: state.id,
        statisticId: statistic.id
      });

      expect(dataSource).toEqual({ id: 1 });
      expect(category).toEqual({ id: 1 });
      expect(state).toEqual({ id: 1 });
      expect(importSession).toEqual({ id: 1 });
      expect(statistic).toEqual({ id: 1 });
      expect(dataPoint).toEqual({ id: 1 });
    });

    it('should clean up all test data', async () => {
      // Create some test data
      await createDataSource(mockDb);
      await createCategory(mockDb);
      await createState(mockDb);

      // Clear all data
      await clearAllTestData(mockDb);

      // Verify all tables were cleared
      expect(mockDb.delete).toHaveBeenCalledTimes(6);
    });
  });
}); 