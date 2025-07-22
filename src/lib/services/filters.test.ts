import { filterStatistics, filterStates, filterDataPoints, FilterOptions } from './filters';

describe('filters', () => {
  describe('filterStatistics', () => {
    const mockStatistics = [
      { id: 1, name: 'Test Stat 1', description: 'First test statistic', category: 'Education', source: 'Department of Education' },
      { id: 2, name: 'Test Stat 2', description: 'Second test statistic', category: 'Economy', source: 'Bureau of Labor' },
      { id: 3, name: 'Another Stat', description: 'Third test statistic', category: 'Education', source: 'Department of Education' }
    ];

    it('should filter by search term in name', () => {
      const filters: FilterOptions = { search: 'Test Stat 1' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Stat 1');
    });

    it('should filter by search term in description', () => {
      const filters: FilterOptions = { search: 'Second test' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].description).toBe('Second test statistic');
    });

    it('should filter by search term in category', () => {
      const filters: FilterOptions = { search: 'Education' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(stat => stat.category === 'Education')).toBe(true);
    });

    it('should filter by exact category', () => {
      const filters: FilterOptions = { category: 'Economy' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('Economy');
    });

    it('should filter by source', () => {
      const filters: FilterOptions = { source: 'Department' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(stat => stat.source.includes('Department'))).toBe(true);
    });

    it('should sort by name ascending', () => {
      const filters: FilterOptions = { sortBy: 'name', sortOrder: 'asc' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result[0].name).toBe('Another Stat');
      expect(result[1].name).toBe('Test Stat 1');
      expect(result[2].name).toBe('Test Stat 2');
    });

    it('should sort by name descending', () => {
      const filters: FilterOptions = { sortBy: 'name', sortOrder: 'desc' };
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result[0].name).toBe('Test Stat 2');
      expect(result[1].name).toBe('Test Stat 1');
      expect(result[2].name).toBe('Another Stat');
    });

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = {};
      const result = filterStatistics(mockStatistics, filters);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('filterStates', () => {
    const mockStates = [
      { id: 1, name: 'California', abbreviation: 'CA' },
      { id: 2, name: 'Colorado', abbreviation: 'CO' },
      { id: 3, name: 'Texas', abbreviation: 'TX' }
    ];

    it('should filter by search term in name', () => {
      const filters: FilterOptions = { search: 'California' };
      const result = filterStates(mockStates, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('California');
    });

    it('should filter by search term in abbreviation', () => {
      const filters: FilterOptions = { search: 'CA' };
      const result = filterStates(mockStates, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].abbreviation).toBe('CA');
    });

    it('should sort by name ascending', () => {
      const filters: FilterOptions = { sortBy: 'name', sortOrder: 'asc' };
      const result = filterStates(mockStates, filters);
      
      expect(result[0].name).toBe('California');
      expect(result[1].name).toBe('Colorado');
      expect(result[2].name).toBe('Texas');
    });

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = {};
      const result = filterStates(mockStates, filters);
      
      expect(result).toHaveLength(3);
    });
  });

  describe('filterDataPoints', () => {
    const mockDataPoints = [
      { id: 1, value: 100, year: 2023, stateName: 'California', stateAbbreviation: 'CA' },
      { id: 2, value: 200, year: 2023, stateName: 'Colorado', stateAbbreviation: 'CO' },
      { id: 3, value: 150, year: 2022, stateName: 'Texas', stateAbbreviation: 'TX' }
    ];

    it('should filter by year', () => {
      const filters: FilterOptions = { year: 2023 };
      const result = filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(2);
      expect(result.every(dp => dp.year === 2023)).toBe(true);
    });

    it('should filter by state name', () => {
      const filters: FilterOptions = { state: 'California' };
      const result = filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].stateName).toBe('California');
    });

    it('should filter by state abbreviation', () => {
      const filters: FilterOptions = { state: 'CA' };
      const result = filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(1);
      expect(result[0].stateAbbreviation).toBe('CA');
    });

    it('should sort by value ascending', () => {
      const filters: FilterOptions = { sortBy: 'value', sortOrder: 'asc' };
      const result = filterDataPoints(mockDataPoints, filters);
      
      expect(result[0].value).toBe(100);
      expect(result[1].value).toBe(150);
      expect(result[2].value).toBe(200);
    });

    it('should sort by value descending', () => {
      const filters: FilterOptions = { sortBy: 'value', sortOrder: 'desc' };
      const result = filterDataPoints(mockDataPoints, filters);
      
      expect(result[0].value).toBe(200);
      expect(result[1].value).toBe(150);
      expect(result[2].value).toBe(100);
    });

    it('should return all items when no filters applied', () => {
      const filters: FilterOptions = {};
      const result = filterDataPoints(mockDataPoints, filters);
      
      expect(result).toHaveLength(3);
    });
  });
}); 