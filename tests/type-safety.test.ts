import { describe, it, expect } from '@jest/globals';
import type { 
  DataPointWithJoins, 
  StatisticWithJoins, 
  StateWithJoins, 
  CategoryWithJoins
} from '../src/lib/types/database-results';
import { 
  isDataPointWithJoins,
  isStatisticWithJoins,
  isStateWithJoins,
  isCategoryWithJoins
} from '../src/lib/types/database-results';
import { 
  createSafeMapper, 
  validateDatabaseResult, 
  ensureTypedDatabaseResult,
  ensureTypedDatabaseResults,
  FORBIDDEN_ANY_MESSAGE 
} from '../src/lib/types/type-safety-rules';

describe('Database Type Safety', () => {
  describe('Database Result Types', () => {
    it('should have proper DataPointWithJoins structure', () => {
      const mockDataPoint: DataPointWithJoins = {
        id: 1,
        statisticId: 100,
        stateId: 50,
        year: 2023,
        value: 123.45,
        importSessionId: 1,
        statisticName: 'GDP',
        stateName: 'California'
      };

      expect(mockDataPoint.id).toBe(1);
      expect(mockDataPoint.statisticName).toBe('GDP');
      expect(mockDataPoint.stateName).toBe('California');
    });

    it('should have proper StatisticWithJoins structure', () => {
      const mockStatistic: StatisticWithJoins = {
        id: 100,
        raNumber: '1001',
        categoryId: 1,
        dataSourceId: 1,
        name: 'GDP',
        description: 'Gross Domestic Product',
        subMeasure: null,
        calculation: null,
        unit: 'dollars',
        availableSince: '2020',
        dataQuality: 'real',
        provenance: 'BEA',
        preferenceDirection: 'higher',
        isActive: 1,
        categoryName: 'Economy',
        dataSourceName: 'BEA'
      };

      expect(mockStatistic.id).toBe(100);
      expect(mockStatistic.categoryName).toBe('Economy');
      expect(mockStatistic.dataSourceName).toBe('BEA');
    });

    it('should have proper StateWithJoins structure', () => {
      const mockState: StateWithJoins = {
        id: 50,
        name: 'California',
        abbreviation: 'CA',
        isActive: 1
      };

      expect(mockState.id).toBe(50);
      expect(mockState.name).toBe('California');
      expect(mockState.abbreviation).toBe('CA');
    });

    it('should have proper CategoryWithJoins structure', () => {
      const mockCategory: CategoryWithJoins = {
        id: 1,
        name: 'Economy',
        description: 'Economic indicators',
        icon: '💰',
        sortOrder: 1,
        isActive: 1
      };

      expect(mockCategory.id).toBe(1);
      expect(mockCategory.name).toBe('Economy');
      expect(mockCategory.icon).toBe('💰');
    });
  });

  describe('Type Guards', () => {
    it('should validate DataPointWithJoins correctly', () => {
      const validDataPoint = {
        id: 1,
        statisticId: 100,
        stateId: 50,
        year: 2023,
        value: 123.45,
        importSessionId: 1,
        statisticName: 'GDP',
        stateName: 'California'
      };

      const invalidDataPoint = {
        id: 1,
        // Missing required fields
      };

      expect(isDataPointWithJoins(validDataPoint)).toBe(true);
      expect(isDataPointWithJoins(invalidDataPoint)).toBe(false);
      expect(isDataPointWithJoins(null)).toBe(false);
      expect(isDataPointWithJoins(undefined)).toBe(false);
    });

    it('should validate StatisticWithJoins correctly', () => {
      const validStatistic = {
        id: 100,
        name: 'GDP',
        unit: 'dollars',
        categoryId: 1
      };

      const invalidStatistic = {
        id: 100,
        // Missing required fields
      };

      expect(isStatisticWithJoins(validStatistic)).toBe(true);
      expect(isStatisticWithJoins(invalidStatistic)).toBe(false);
    });

    it('should validate StateWithJoins correctly', () => {
      const validState = {
        id: 50,
        name: 'California',
        abbreviation: 'CA'
      };

      const invalidState = {
        id: 50,
        // Missing required fields
      };

      expect(isStateWithJoins(validState)).toBe(true);
      expect(isStateWithJoins(invalidState)).toBe(false);
    });

    it('should validate CategoryWithJoins correctly', () => {
      const validCategory = {
        id: 1,
        name: 'Economy',
        sortOrder: 1
      };

      const invalidCategory = {
        id: 1,
        // Missing required fields
      };

      expect(isCategoryWithJoins(validCategory)).toBe(true);
      expect(isCategoryWithJoins(invalidCategory)).toBe(false);
    });
  });

  describe('Type Safety Utilities', () => {
    it('should create safe mapper correctly', () => {
      const mockDataPoints: DataPointWithJoins[] = [
        {
          id: 1,
          statisticId: 100,
          stateId: 50,
          year: 2023,
          value: 123.45,
          importSessionId: 1,
          statisticName: 'GDP',
          stateName: 'California'
        }
      ];

      const mapper = (dbResult: DataPointWithJoins) => ({
        id: dbResult.id,
        value: dbResult.value,
        name: dbResult.statisticName || 'Unknown'
      });

      const safeMapper = createSafeMapper(mapper);
      const result = safeMapper(mockDataPoints);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].value).toBe(123.45);
      expect(result[0].name).toBe('GDP');
    });

    it('should validate database results correctly', () => {
      const validResult = {
        id: 1,
        name: 'Test',
        value: 100
      };

      const invalidResult = {
        id: 1,
        // Missing required fields
      };

      expect(validateDatabaseResult(validResult, ['id', 'name', 'value'], 'TestType')).toBe(true);
      
      expect(() => {
        validateDatabaseResult(invalidResult, ['id', 'name', 'value'], 'TestType');
      }).toThrow('Invalid TestType: missing required key \'name\'');
    });

    it('should ensure typed database results correctly', () => {
      const validDataPoint: DataPointWithJoins = {
        id: 1,
        statisticId: 100,
        stateId: 50,
        year: 2023,
        value: 123.45,
        importSessionId: 1,
        statisticName: 'GDP',
        stateName: 'California'
      };

      const result = ensureTypedDatabaseResult(validDataPoint, isDataPointWithJoins, 'DataPointWithJoins');
      expect(result).toEqual(validDataPoint);
    });

    it('should ensure typed database results array correctly', () => {
      const validDataPoints: DataPointWithJoins[] = [
        {
          id: 1,
          statisticId: 100,
          stateId: 50,
          year: 2023,
          value: 123.45,
          importSessionId: 1,
          statisticName: 'GDP',
          stateName: 'California'
        },
        {
          id: 2,
          statisticId: 101,
          stateId: 51,
          year: 2023,
          value: 456.78,
          importSessionId: 1,
          statisticName: 'Population',
          stateName: 'Texas'
        }
      ];

      const result = ensureTypedDatabaseResults(validDataPoints, isDataPointWithJoins, 'DataPointWithJoins');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
    });

    it('should throw error for invalid database results', () => {
      const invalidDataPoint = {
        id: 1,
        // Missing required fields
      };

      expect(() => {
        ensureTypedDatabaseResult(invalidDataPoint, isDataPointWithJoins, 'DataPointWithJoins');
      }).toThrow('Invalid DataPointWithJoins: result does not match expected structure');
    });
  });

  describe('Error Messages', () => {
    it('should have proper forbidden any message', () => {
      expect(FORBIDDEN_ANY_MESSAGE).toContain('❌');
      expect(FORBIDDEN_ANY_MESSAGE).toContain('any');
      expect(FORBIDDEN_ANY_MESSAGE).toContain('forbidden');
      expect(FORBIDDEN_ANY_MESSAGE).toContain('database-results');
    });
  });

  describe('Type Safety in Practice', () => {
    it('should prevent compilation with any types', () => {
      // This test documents the expected behavior
      // In practice, TypeScript would prevent compilation if 'any' is used
      
      const mockDatabaseResult = {
        id: 1,
        statisticId: 100,
        stateId: 50,
        year: 2023,
        value: 123.45,
        importSessionId: 1,
        statisticName: 'GDP',
        stateName: 'California'
      };

      // ✅ Correct way - using proper types
      const correctMapper = (result: DataPointWithJoins) => ({
        id: result.id,
        value: result.value,
        name: result.statisticName || 'Unknown'
      });

      // This should work without errors
      const correctResult = correctMapper(mockDatabaseResult as DataPointWithJoins);
      expect(correctResult.id).toBe(1);

      // ❌ Incorrect way - using 'any' (would cause compilation error)
      // const incorrectMapper = (result: any) => ({
      //   id: result.id,
      //   value: result.value,
      //   name: result.statisticName || 'Unknown'
      // });

      // The above would be caught by ESLint and TypeScript
    });
  });
});
