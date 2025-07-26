import { db } from '../db/index';
import { statistics, dataSources, categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { 
  IStatisticsService, 
  StatisticData, 
  CreateStatisticInput, 
  UpdateStatisticInput 
} from '../types/service-interfaces';

export class StatisticsService {
  static async getAllStatisticsWithSources(): Promise<StatisticData[]> {
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      dataQuality: statistics.dataQuality,
      provenance: statistics.provenance,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      dataSourceName: dataSources.name,
    })
      .from(statistics)
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .leftJoin(categories, eq(statistics.categoryId, categories.id));

    return results.map(result => ({
      id: result.id,
      name: result.name,
      raNumber: result.raNumber,
      description: result.description,
      subMeasure: result.subMeasure,
      calculation: result.calculation,
      unit: result.unit,
      availableSince: result.availableSince,
      dataQuality: result.dataQuality ?? 'mock',
      provenance: result.provenance,
      isActive: result.isActive ?? 1,
      categoryId: result.categoryId,
      dataSourceId: result.dataSourceId,
      categoryName: result.categoryName || undefined,
      dataSourceName: result.dataSourceName || undefined,
    }));
  }

  static async getStatisticById(id: number): Promise<StatisticData | null> {
    const result = await db.select().from(statistics).where(eq(statistics.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const statistic = result[0];
    return {
      ...statistic,
      dataQuality: statistic.dataQuality ?? 'mock',
      isActive: statistic.isActive ?? 1,
    };
  }

  static async getStatisticsByCategory(categoryId: number): Promise<StatisticData[]> {
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      dataQuality: statistics.dataQuality,
      provenance: statistics.provenance,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
    })
      .from(statistics)
      .where(eq(statistics.categoryId, categoryId));

    return results.map(statistic => ({
      ...statistic,
      dataQuality: statistic.dataQuality ?? 'mock',
      isActive: statistic.isActive ?? 1,
    }));
  }

  static async createStatistic(data: CreateStatisticInput): Promise<StatisticData> {
    const [statistic] = await db.insert(statistics).values(data).returning();
    return {
      ...statistic,
      dataQuality: statistic.dataQuality ?? 'mock',
      isActive: statistic.isActive ?? 1,
    };
  }

  static async updateStatistic(id: number, data: UpdateStatisticInput): Promise<StatisticData> {
    const [statistic] = await db.update(statistics).set(data).where(eq(statistics.id, id)).returning();
    if (!statistic) {
      throw new Error(`Statistic with id ${id} not found`);
    }
    return {
      ...statistic,
      dataQuality: statistic.dataQuality ?? 'mock',
      isActive: statistic.isActive ?? 1,
    };
  }

  static async deleteStatistic(id: number): Promise<boolean> {
    const result = await db.delete(statistics).where(eq(statistics.id, id)).returning();
    return result.length > 0;
  }
} 