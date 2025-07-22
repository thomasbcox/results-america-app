import { createTestDb } from '../db/testDb';
import * as statisticsService from './statisticsService';
import { createDataSource, createCategory, createStatistic, clearAllTestData } from './testUtils';

let db;
let categoryId;
let dataSourceId;

beforeEach(async () => {
  db = createTestDb();
  // Create FK dependencies in order
  const category = await createCategory(db);
  const dataSource = await createDataSource(db);
  categoryId = category.id;
  dataSourceId = dataSource.id;
});

afterEach(async () => {
  await clearAllTestData(db);
});

describe('statisticsService', () => {
  it('should create a new statistic', async () => {
    const [created] = await statisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      unit: 'TestUnit',
    }, db);
    expect(created).toHaveProperty('id');
    expect(created.name).toBe('Test Stat');
    expect(created.raNumber).toBe('9999');
  });

  it('should get all statistics with sources', async () => {
    await statisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      unit: 'TestUnit',
    }, db);
    const all = await statisticsService.getAllStatisticsWithSources(db);
    expect(Array.isArray(all)).toBe(true);
    expect(all.some(s => s.name === 'Test Stat')).toBe(true);
    expect(all.some(s => s.source === 'TestSource')).toBe(true);
  });

  it('should get a statistic by id', async () => {
    const [created] = await statisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      unit: 'TestUnit',
    }, db);
    const stat = await statisticsService.getStatisticById(created.id, db);
    expect(stat).toBeTruthy();
    expect(stat.name).toBe('Test Stat');
  });

  it('should update a statistic', async () => {
    const [created] = await statisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      unit: 'TestUnit',
    }, db);
    const [updated] = await statisticsService.updateStatistic(created.id, { name: 'Test Stat 2' }, db);
    expect(updated.name).toBe('Test Stat 2');
  });

  it('should delete a statistic', async () => {
    const [created] = await statisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      unit: 'TestUnit',
    }, db);
    const [deleted] = await statisticsService.deleteStatistic(created.id, db);
    expect(deleted.name).toBe('Test Stat');
    const after = await statisticsService.getStatisticById(created.id, db);
    expect(after).toBeNull();
  });
}); 