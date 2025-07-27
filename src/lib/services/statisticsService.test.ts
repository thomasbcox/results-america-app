import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { setupTestDatabase, clearTestData, getTestDb, seedTestData } from '../test-setup';
import { categories, dataSources, statistics } from '../db/schema-normalized';
import { eq } from 'drizzle-orm';

// Create a test-specific version of StatisticsService
class TestStatisticsService {
  static async getAllStatisticsWithSources(): Promise<any[]> {
    const db = getTestDb();
    const result = await db.select({
      id: statistics.id,
      raNumber: statistics.raNumber,
      name: statistics.name,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      categoryDescription: categories.description,
      sourceName: dataSources.name,
      sourceDescription: dataSources.description,
      sourceUrl: dataSources.url,
    })
    .from(statistics)
    .leftJoin(categories, eq(statistics.categoryId, categories.id))
    .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
    .orderBy(statistics.name);
    
    return result.map((stat: any) => ({
      ...stat,
      isActive: stat.isActive ?? 1,
      category: stat.categoryName ? {
        id: stat.categoryId,
        name: stat.categoryName,
        description: stat.categoryDescription,
      } : null,
      source: stat.sourceName ? {
        id: stat.dataSourceId,
        name: stat.sourceName,
        description: stat.sourceDescription,
        url: stat.sourceUrl,
      } : null,
    }));
  }

  static async getStatisticById(id: number): Promise<any | null> {
    const db = getTestDb();
    const result = await db.select().from(statistics).where(eq(statistics.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const statistic = result[0];
    return {
      ...statistic,
      isActive: statistic.isActive ?? 1,
    };
  }

  static async createStatistic(data: any): Promise<any> {
    const db = getTestDb();
    const [statistic] = await db.insert(statistics).values(data).returning();
    return {
      ...statistic,
      isActive: statistic.isActive ?? 1,
    };
  }

  static async updateStatistic(id: number, data: any): Promise<any> {
    const db = getTestDb();
    const [statistic] = await db.update(statistics).set(data).where(eq(statistics.id, id)).returning();
    if (!statistic) {
      throw new Error(`Statistic with id ${id} not found`);
    }
    return {
      ...statistic,
      isActive: statistic.isActive ?? 1,
    };
  }

  static async deleteStatistic(id: number): Promise<boolean> {
    const db = getTestDb();
    const result = await db.delete(statistics).where(eq(statistics.id, id)).returning();
    return result.length > 0;
  }
}

describe('statisticsService', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  it('should create a new statistic', async () => {
    // Get existing category and data source from seeded data
    const db = getTestDb();
    const existingCategories = await db.select().from(categories);
    const existingDataSources = await db.select().from(dataSources);
    
    const categoryId = existingCategories[0].id;
    const dataSourceId = existingDataSources[0].id;

    const created = await TestStatisticsService.createStatistic({
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
    const all = await TestStatisticsService.getAllStatisticsWithSources();
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  it('should get a statistic by id', async () => {
    // Get existing category and data source from seeded data
    const db = getTestDb();
    const existingCategories = await db.select().from(categories);
    const existingDataSources = await db.select().from(dataSources);
    
    const categoryId = existingCategories[0].id;
    const dataSourceId = existingDataSources[0].id;

    const created = await TestStatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const statistic = await TestStatisticsService.getStatisticById(created.id);
    expect(statistic).toBeDefined();
    expect(statistic?.name).toBe('Test Stat');
  });

  it('should update a statistic', async () => {
    // Get existing category and data source from seeded data
    const db = getTestDb();
    const existingCategories = await db.select().from(categories);
    const existingDataSources = await db.select().from(dataSources);
    
    const categoryId = existingCategories[0].id;
    const dataSourceId = existingDataSources[0].id;

    const created = await TestStatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const updated = await TestStatisticsService.updateStatistic(created.id, {
      name: 'Updated Stat',
      description: 'Updated Description',
    });
    expect(updated.name).toBe('Updated Stat');
  });

  it('should delete a statistic', async () => {
    // Get existing category and data source from seeded data
    const db = getTestDb();
    const existingCategories = await db.select().from(categories);
    const existingDataSources = await db.select().from(dataSources);
    
    const categoryId = existingCategories[0].id;
    const dataSourceId = existingDataSources[0].id;

    const created = await TestStatisticsService.createStatistic({
      name: 'Test Stat',
      raNumber: '9999',
      categoryId,
      dataSourceId,
      description: 'Test Description',
      unit: 'test',
    });

    const deleted = await TestStatisticsService.deleteStatistic(created.id);
    expect(deleted).toBe(true);

    const statistic = await TestStatisticsService.getStatisticById(created.id);
    expect(statistic).toBeNull();
  });
}); 