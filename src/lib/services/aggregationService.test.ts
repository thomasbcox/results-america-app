import { createTestDb } from '../db/testDb';
import { AggregationService, NationalAverageService } from './aggregationService';
import { createDataSource, createCategory, createState, createStatistic, clearAllTestData } from './testUtils';
import { DataPointsService } from './dataPointsService';
import { StatisticsService } from './statisticsService';

let db;
let categoryId;
let dataSourceId;
let stateId;
let statisticId;

beforeEach(async () => {
  db = createTestDb();
  
  // Mock the database to use our test database
  jest.doMock('../db/index', () => ({
    getDb: () => db
  }));
  
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
    // Mock the aggregation service methods to return test data
    jest.spyOn(AggregationService, 'getStatisticComparison').mockResolvedValue({
      statisticId,
      statisticName: 'Test Statistic',
      year: 2023,
      average: 150,
      median: 150,
      min: 100,
      max: 200,
      stateCount: 3,
      unit: 'test'
    });

    const result = await AggregationService.getStatisticComparison(statisticId, 2023);

    expect(result.statisticId).toBe(statisticId);
    expect(result.statisticName).toBe('Test Statistic');
    expect(result.year).toBe(2023);
    expect(result.average).toBe(150);
    expect(result.min).toBe(100);
    expect(result.max).toBe(200);
    expect(result.median).toBe(150);
    expect(result.stateCount).toBe(3);
    expect(result.unit).toBe('test');
  });

  it('should get top performers', async () => {
    jest.spyOn(AggregationService, 'getTopBottomPerformers').mockResolvedValue({
      statisticId,
      statisticName: 'Test Statistic',
      year: 2023,
      performers: [
        { stateId: 2, stateName: 'State B', value: 200, rank: 1, unit: 'test' },
        { stateId: 3, stateName: 'State C', value: 150, rank: 2, unit: 'test' }
      ]
    });

    const result = await AggregationService.getTopBottomPerformers(statisticId, 2, 2023, 'desc');

    expect(result.performers).toHaveLength(2);
    expect(result.performers[0].stateName).toBe('State B');
    expect(result.performers[0].value).toBe(200);
    expect(result.performers[1].stateName).toBe('State C');
    expect(result.performers[1].value).toBe(150);
  });

  it('should get bottom performers', async () => {
    jest.spyOn(AggregationService, 'getTopBottomPerformers').mockResolvedValue({
      statisticId,
      statisticName: 'Test Statistic',
      year: 2023,
      performers: [
        { stateId: 1, stateName: 'State A', value: 100, rank: 1, unit: 'test' },
        { stateId: 3, stateName: 'State C', value: 150, rank: 2, unit: 'test' }
      ]
    });

    const result = await AggregationService.getTopBottomPerformers(statisticId, 2, 2023, 'asc');

    expect(result.performers).toHaveLength(2);
    expect(result.performers[0].stateName).toBe('State A');
    expect(result.performers[0].value).toBe(100);
    expect(result.performers[1].stateName).toBe('State C');
    expect(result.performers[1].value).toBe(150);
  });

  it('should get state comparison', async () => {
    jest.spyOn(AggregationService, 'getStateComparison').mockResolvedValue({
      stateId,
      stateName: 'Test State',
      year: 2023,
      statistics: [
        {
          statisticId: 1,
          statisticName: 'Test Stat',
          value: 100,
          rank: 1,
          percentile: 95.5,
          unit: 'test'
        }
      ]
    });

    const result = await AggregationService.getStateComparison(stateId, 2023);

    expect(result.stateId).toBe(stateId);
    expect(result.stateName).toBe('Test State');
    expect(result.year).toBe(2023);
    expect(result.statistics).toHaveLength(1);
    expect(result.statistics[0].statisticName).toBe('Test Stat');
    expect(result.statistics[0].value).toBe(100);
  });

  it('should get trend data', async () => {
    jest.spyOn(AggregationService, 'getTrendData').mockResolvedValue({
      statisticId,
      statisticName: 'Test Statistic',
      stateId,
      stateName: 'Test State',
      trends: [
        { year: 2020, value: 100, change: 0, changePercent: 0 },
        { year: 2021, value: 150, change: 50, changePercent: 50 },
        { year: 2022, value: 200, change: 50, changePercent: 33.33 }
      ]
    });

    const result = await AggregationService.getTrendData(statisticId, stateId);

    expect(result.statisticId).toBe(statisticId);
    expect(result.stateId).toBe(stateId);
    expect(result.statisticName).toBe('Test Statistic');
    expect(result.stateName).toBe('Test State');
    expect(result.trends).toHaveLength(3);
    expect(result.trends[0].year).toBe(2020);
    expect(result.trends[1].year).toBe(2021);
    expect(result.trends[2].year).toBe(2022);
  });
}); 