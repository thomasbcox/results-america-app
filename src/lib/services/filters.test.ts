import { FilterService } from './filters';
import type { FilterOptions, StatisticData, StateData, DataPointData } from '../types/service-interfaces';

// Mock data that matches the actual schema
const mockStatistics: StatisticData[] = [
  {
    id: 1,
    name: 'Test Stat 1',
    description: 'First test statistic',
    categoryId: 1,
    unit: 'percent',
    dataQuality: 'mock',
    isActive: 1,
  },
  {
    id: 2,
    name: 'Test Stat 2',
    description: 'Second test statistic',
    categoryId: 2,
    unit: 'dollars',
    dataQuality: 'real',
    isActive: 1,
  },
  {
    id: 3,
    name: 'Another Stat',
    description: 'Third test statistic',
    categoryId: 1,
    unit: 'count',
    dataQuality: 'mock',
    isActive: 0,
  },
];

const mockStates: StateData[] = [
  {
    id: 1,
    name: 'California',
    abbreviation: 'CA',
    isActive: 1,
  },
  {
    id: 2,
    name: 'Colorado',
    abbreviation: 'CO',
    isActive: 1,
  },
  {
    id: 3,
    name: 'Texas',
    abbreviation: 'TX',
    isActive: 0,
  },
];

const mockDataPoints: DataPointData[] = [
  {
    id: 1,
    stateId: 1,
    statisticId: 1,
    year: 2023,
    value: 100,
    importSessionId: 1,
  },
  {
    id: 2,
    stateId: 2,
    statisticId: 1,
    year: 2023,
    value: 200,
    importSessionId: 1,
  },
  {
    id: 3,
    stateId: 3,
    statisticId: 1,
    year: 2022,
    value: 150,
    importSessionId: 1,
  },
];

describe('filters', () => {
  describe('filterStatistics', () => {
    it('should filter by search term in name', () => {
      const filters: FilterOptions = { search: 'Test Stat 1' };
      const result = FilterService.filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Stat 1');
    });

    it('should filter by search term in description', () => {
      const filters: FilterOptions = { search: 'Second test' };
      const result = FilterService.filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Second test statistic');
    });

    it('should filter by category ID', () => {
      const filters: FilterOptions = { categoryId: 1 };
      const result = FilterService.filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(stat => stat.categoryId === 1)).toBe(true);
    });

    it('should filter by data quality', () => {
      const filters: FilterOptions = { dataQuality: 'mock' };
      const result = FilterService.filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(stat => stat.dataQuality === 'mock')).toBe(true);
    });

    it('should filter by active status', () => {
      const filters: FilterOptions = { isActive: true };
      const result = FilterService.filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(stat => stat.isActive === 1)).toBe(true);
    });

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = {};
      const result = FilterService.filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('filterStates', () => {
    it('should filter by search term in name', () => {
      const filters: FilterOptions = { search: 'California' };
      const result = FilterService.filterStates(mockStates, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('California');
    });

    it('should filter by search term in abbreviation', () => {
      const filters: FilterOptions = { search: 'CA' };
      const result = FilterService.filterStates(mockStates, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].abbreviation).toBe('CA');
    });

    it('should filter by active status', () => {
      const filters: FilterOptions = { isActive: true };
      const result = FilterService.filterStates(mockStates, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(state => state.isActive === 1)).toBe(true);
    });

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = {};
      const result = FilterService.filterStates(mockStates, filters);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('filterDataPoints', () => {
    it('should filter by year', () => {
      const filters: FilterOptions = { year: 2023 };
      const result = FilterService.filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(dp => dp.year === 2023)).toBe(true);
    });

    it('should filter by state ID', () => {
      const filters: FilterOptions = { stateId: 1 };
      const result = FilterService.filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].stateId).toBe(1);
    });

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = {};
      const result = FilterService.filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(3);
    });
  });
}); 