import { createTestDb } from '../db/testDb';
import * as aggregationService from './aggregationService';
import { createDataSource, createCategory, createState, createStatistic, clearAllTestData } from './testUtils';
import * as dataPointsService from './dataPointsService';
import * as statisticsService from './statisticsService';

let db;
let categoryId;
let dataSourceId;
let stateId;
let statisticId;

beforeEach(async () => {
  db = createTestDb();
  
  // Create test data
  const category = await createCategory(db);
  const dataSource = await createDataSource(db);
  const state = await createState(db);
  const statistic = await createStatistic(db, { categoryId: category.id, dataSourceId: dataSource.id });
  
  categoryId = category.id;
  dataSourceId = dataSource.id;
  stateId = state.id;
  statisticId = statistic.id;
});

afterEach(async () => {
  await clearAllTestData(db);
});

describe('aggregationService', () => {
  it('should get statistic comparison', async () => {
    // Create additional test data points
    const state2 = await createState(db, { name: 'State B', abbreviation: 'SB' });
    const state3 = await createState(db, { name: 'State C', abbreviation: 'SC' });
    
    const mockDataPoints = [
      { id: 1, value: 100, year: 2023, stateName: 'State A', statisticId },
      { id: 2, value: 200, year: 2023, stateName: 'State B', statisticId },
      { id: 3, value: 150, year: 2023, stateName: 'State C', statisticId }
    ];
    
    // Mock data points service to return test data
    jest.spyOn(dataPointsService, 'getDataPointsForStatistic').mockResolvedValue(mockDataPoints);
    
    // Mock the NationalAverageService to return the expected average
    jest.spyOn(aggregationService.NationalAverageService, 'getNationalAverage').mockResolvedValue(150);

    const result = await aggregationService.getStatisticComparison(statisticId, 2023);

    expect(result.states).toHaveLength(3);
    expect(result.values).toHaveLength(3);
    expect(result.average).toBe(150);
    expect(result.min).toBe(100);
    expect(result.max).toBe(200);
    expect(result.median).toBe(150);
  });

  it('should get top performers', async () => {
    jest.spyOn(dataPointsService, 'getDataPointsForStatistic').mockResolvedValue([
      { id: 1, value: 100, year: 2023, stateName: 'State A', statisticId },
      { id: 2, value: 200, year: 2023, stateName: 'State B', statisticId },
      { id: 3, value: 150, year: 2023, stateName: 'State C', statisticId }
    ]);

    const result = await aggregationService.getTopPerformers(statisticId, 2, 2023);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('State B');
    expect(result[0].value).toBe(200);
    expect(result[1].name).toBe('State C');
    expect(result[1].value).toBe(150);
  });

  it('should get bottom performers', async () => {
    jest.spyOn(dataPointsService, 'getDataPointsForStatistic').mockResolvedValue([
      { id: 1, value: 100, year: 2023, stateName: 'State A', statisticId },
      { id: 2, value: 200, year: 2023, stateName: 'State B', statisticId },
      { id: 3, value: 150, year: 2023, stateName: 'State C', statisticId }
    ]);

    const result = await aggregationService.getBottomPerformers(statisticId, 2, 2023);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('State A');
    expect(result[0].value).toBe(100);
    expect(result[1].name).toBe('State C');
    expect(result[1].value).toBe(150);
  });

  it('should get state comparison', async () => {
    jest.spyOn(dataPointsService, 'getDataPointsForState').mockResolvedValue([
      { 
        id: 1, 
        value: 100, 
        year: 2023, 
        statisticName: 'Test Stat',
        statisticUnit: 'test',
        categoryName: 'Education',
        sourceName: 'Test Source',
        sourceUrl: 'http://test.com',
        importDate: new Date()
      }
    ]);

    const result = await aggregationService.getStateComparison(stateId, 2023);

    expect(result.labels).toContain('Education');
    expect(result.datasets).toHaveLength(1);
    expect(result.datasets[0].data).toHaveLength(1);
  });

  it('should get trend data', async () => {
    // Mock the data points service to return data for the specific state
    jest.spyOn(dataPointsService, 'getDataPointsForStatistic').mockImplementation(async (statId, year) => {
      if (year === 2020) {
        return [{ id: 1, value: 100, year: 2020, stateName: 'State A', stateAbbreviation: 'SA' }];
      } else if (year === 2021) {
        return [{ id: 2, value: 150, year: 2021, stateName: 'State A', stateAbbreviation: 'SA' }];
      } else if (year === 2022) {
        return [{ id: 3, value: 200, year: 2022, stateName: 'State A', stateAbbreviation: 'SA' }];
      }
      return [];
    });

    const result = await aggregationService.getTrendData(statisticId, stateId, [2020, 2021, 2022]);

    expect(result.labels).toEqual(['Value']);
    expect(result.datasets).toHaveLength(3);
    expect(result.datasets[0].label).toBe('Year 2020');
    expect(result.datasets[1].label).toBe('Year 2021');
    expect(result.datasets[2].label).toBe('Year 2022');
  });
}); 