import { StatisticsService } from './statisticsService';
import { db } from '../db/index';
import { categories, dataSources } from '../db/schema';
import { eq } from 'drizzle-orm';

describe('statisticsService', () => {
  let categoryId: number;
  let dataSourceId: number;

  beforeAll(async () => {
    // Create test category
    const [category] = await db.insert(categories).values({
      name: 'Test Category',
      description: 'Test Description',
      icon: 'TestIcon',
      sortOrder: 1,
    }).returning();
    categoryId = category.id;

    // Create test data source
    const [dataSource] = await db.insert(dataSources).values({
      name: 'Test Source',
      url: 'https://test.com',
      description: 'Test Description',
    }).returning();
    dataSourceId = dataSource.id;
  });

  afterAll(async () => {
    // Clean up test data
    await db.delete(categories).where(eq(categories.id, categoryId));
    await db.delete(dataSources).where(eq(dataSources.id, dataSourceId));
  });

  it('should create a new statistic', async () => {
    const created = await StatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Test Stat');
    expect(created.raNumber).toBe('9999');
    expect(created.categoryId).toBe(categoryId);
  });

  it('should get all statistics with sources', async () => {
    await StatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const all = await StatisticsService.getAllStatisticsWithSources();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  it('should get a statistic by id', async () => {
    const created = await StatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const statistic = await StatisticsService.getStatisticById(created.id);
    expect(statistic).toBeDefined();
    expect(statistic?.name).toBe('Test Stat');
  });

  it('should update a statistic', async () => {
    const created = await StatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const updated = await StatisticsService.updateStatistic(created.id, {
      name: 'Updated Stat',
      description: 'Updated Description',
    });
    expect(updated.name).toBe('Updated Stat');
  });

  it('should delete a statistic', async () => {
    const created = await StatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const deleted = await StatisticsService.deleteStatistic(created.id);
    expect(deleted).toBe(true);

    const statistic = await StatisticsService.getStatisticById(created.id);
    expect(statistic).toBeNull();
  });
}); 