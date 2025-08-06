import { getDb } from '../db/index';
import { statistics, dataSources, categories, dataPoints, states } from '../db/schema-postgres';
import { eq, like, desc, asc, count, sql, and, inArray } from 'drizzle-orm';
import type { 
  IStatisticsService, 
  StatisticData, 
  CreateStatisticInput, 
  UpdateStatisticInput 
} from '../types/service-interfaces';

export class StatisticsService {
  static async getAllStatistics(): Promise<StatisticData[]> {
    return this.getAllStatisticsWithSources();
  }

  static async searchStatistics(searchTerm: string): Promise<StatisticData[]> {
    const db = getDb();
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      preferenceDirection: statistics.preferenceDirection,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      dataSourceName: dataSources.name,
    })
      .from(statistics)
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .leftJoin(categories, eq(statistics.categoryId, categories.id))
      .where(
        like(statistics.name, `%${searchTerm}%`)
      );

    return results.map((result: any) => ({
      id: result.id,
      name: result.name,
      raNumber: result.raNumber,
      description: result.description,
      subMeasure: result.subMeasure,
      calculation: result.calculation,
      unit: result.unit,
      availableSince: result.availableSince,
      preferenceDirection: result.preferenceDirection || 'higher',
      dataQuality: 'mock',
      provenance: undefined,
      isActive: result.isActive ?? 1,
      categoryId: result.categoryId,
      dataSourceId: result.dataSourceId,
      categoryName: result.categoryName || undefined,
      dataSourceName: result.dataSourceName || undefined,
    }));
  }

  static async getStatisticsWithPagination(
    pagination: { page: number; limit: number },
    sorting?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ data: StatisticData[]; pagination: any }> {
    const db = getDb();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Build order by clause
    let orderBy = desc(statistics.id); // default
    if (sorting?.sortBy) {
      const sortField = sorting.sortBy as keyof typeof statistics;
      if (sorting.sortOrder === 'asc') {
        orderBy = asc(statistics[sortField] as any);
      } else {
        orderBy = desc(statistics[sortField] as any);
      }
    }

    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      dataSourceName: dataSources.name,
    })
      .from(statistics)
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .leftJoin(categories, eq(statistics.categoryId, categories.id))
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select({ count: statistics.id }).from(statistics);
    const total = totalResult.length;

    const data = results.map((result: any) => ({
      id: result.id,
      name: result.name,
      raNumber: result.raNumber,
      description: result.description,
      subMeasure: result.subMeasure,
      calculation: result.calculation,
      unit: result.unit,
      availableSince: result.availableSince,
      dataQuality: 'mock',
      provenance: undefined,
      isActive: result.isActive ?? 1,
      categoryId: result.categoryId,
      dataSourceId: result.dataSourceId,
      categoryName: result.categoryName || undefined,
      dataSourceName: result.dataSourceName || undefined,
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      }
    };
  }

  static async getStatisticsWithAvailability(): Promise<StatisticData[]> {
    // For now, return all statistics with a hasData flag
    const results = await this.getAllStatisticsWithSources();
    
    return results.map(statistic => ({
      ...statistic,
      hasData: true, // Assume all statistics have data for now
    }));
  }

  static async getAllStatisticsWithSources(): Promise<StatisticData[]> {
    const db = getDb();
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      preferenceDirection: statistics.preferenceDirection,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      dataSourceName: dataSources.name,
    })
      .from(statistics)
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .leftJoin(categories, eq(statistics.categoryId, categories.id));

    return results.map((result: any) => ({
      id: result.id,
      name: result.name,
      raNumber: result.raNumber,
      description: result.description,
      subMeasure: result.subMeasure,
      calculation: result.calculation,
      unit: result.unit,
      availableSince: result.availableSince,
      preferenceDirection: result.preferenceDirection || 'higher',
      dataQuality: 'mock', // Default for normalized schema
      provenance: undefined, // Not available in normalized schema
      isActive: result.isActive ?? 1,
      categoryId: result.categoryId,
      dataSourceId: result.dataSourceId,
      categoryName: result.categoryName || undefined,
      dataSourceName: result.dataSourceName || undefined,
    }));
  }

  static async getStatisticById(id: number): Promise<StatisticData | null> {
    const db = getDb();
    const result = await db.select().from(statistics).where(eq(statistics.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const statistic = result[0];
    return {
      ...statistic,
      preferenceDirection: statistic.preferenceDirection || 'higher',
      dataQuality: 'mock', // Default for normalized schema
      provenance: undefined, // Not available in normalized schema
      isActive: statistic.isActive ?? 1,
    };
  }

  static async getStatisticsByCategory(categoryId: number): Promise<StatisticData[]> {
    const db = getDb();
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      preferenceDirection: statistics.preferenceDirection,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
    })
      .from(statistics)
      .where(eq(statistics.categoryId, categoryId));

    return results.map((statistic: any) => ({
      ...statistic,
      preferenceDirection: statistic.preferenceDirection || 'higher',
      dataQuality: 'mock', // Default for normalized schema
      provenance: undefined, // Not available in normalized schema
      isActive: statistic.isActive ?? 1,
    }));
  }

  // NEW: Critical missing analytics methods for immediate business value

  static async getStatisticSummary(statisticId: number, year?: number): Promise<{
    statistic: StatisticData;
    dataSummary: {
      totalRecords: number;
      statesWithData: number;
      yearsWithData: number[];
      averageValue: number;
      minValue: number;
      maxValue: number;
      lastUpdated: Date;
    };
  }> {
    const db = getDb();
    const statistic = await this.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    const conditions = [eq(dataPoints.statisticId, statisticId)];
    if (year) {
      conditions.push(eq(dataPoints.year, year));
    }

    const [summaryResult, statesResult, yearsResult, lastUpdatedResult] = await Promise.all([
      db.select({
        totalRecords: count(),
        averageValue: sql<number>`AVG(${dataPoints.value})`,
        minValue: sql<number>`MIN(${dataPoints.value})`,
        maxValue: sql<number>`MAX(${dataPoints.value})`,
      }).from(dataPoints).where(and(...conditions)),
      db.select({ stateId: dataPoints.stateId }).from(dataPoints).where(and(...conditions)).groupBy(dataPoints.stateId),
      db.select({ year: dataPoints.year }).from(dataPoints).where(and(...conditions)).groupBy(dataPoints.year),
      db.select({ lastUpdated: dataPoints.id }).from(dataPoints).where(and(...conditions)).orderBy(desc(dataPoints.id)).limit(1),
    ]);

    return {
      statistic,
      dataSummary: {
        totalRecords: summaryResult[0]?.totalRecords || 0,
        statesWithData: statesResult.length,
        yearsWithData: yearsResult.map((r: any) => r.year).sort(),
        averageValue: summaryResult[0]?.averageValue || 0,
        minValue: summaryResult[0]?.minValue || 0,
        maxValue: summaryResult[0]?.maxValue || 0,
        lastUpdated: lastUpdatedResult[0] ? new Date() : new Date(0), // Simplified for now
      },
    };
  }

  static async getStatisticTrends(statisticId: number, years: number[]): Promise<{
    statistic: StatisticData;
    trends: Array<{
      year: number;
      averageValue: number;
      recordCount: number;
      stateCount: number;
    }>;
  }> {
    const db = getDb();
    const statistic = await this.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    const trends = await db.select({
      year: dataPoints.year,
      averageValue: sql<number>`AVG(${dataPoints.value})`,
      recordCount: count(),
      stateCount: sql<number>`COUNT(DISTINCT ${dataPoints.stateId})`,
    })
      .from(dataPoints)
      .where(and(eq(dataPoints.statisticId, statisticId), inArray(dataPoints.year, years)))
      .groupBy(dataPoints.year)
      .orderBy(dataPoints.year);

    return {
      statistic,
      trends: trends.map((trend: any) => ({
        year: trend.year,
        averageValue: trend.averageValue || 0,
        recordCount: trend.recordCount,
        stateCount: trend.stateCount || 0,
      })),
    };
  }

  static async getStatisticRankings(statisticId: number, year: number, order: 'asc' | 'desc' = 'desc'): Promise<{
    statistic: StatisticData;
    year: number;
    rankings: Array<{
      stateId: number;
      stateName: string;
      value: number;
      rank: number;
      percentile: number;
    }>;
  }> {
    const db = getDb();
    const statistic = await this.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    // Get all values for this statistic and year
    const values = await db.select({
      stateId: dataPoints.stateId,
      stateName: states.name,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(eq(dataPoints.statisticId, statisticId), eq(dataPoints.year, year)))
      .orderBy(order === 'desc' ? desc(dataPoints.value) : asc(dataPoints.value));

    // Calculate rankings and percentiles
    const rankings = values.map((item: any, index: number) => {
      const rank = index + 1;
      const percentile = ((rank - 1) / (values.length - 1)) * 100;
      return {
        stateId: item.stateId,
        stateName: item.stateName || 'Unknown',
        value: item.value,
        rank,
        percentile: Math.round(percentile * 100) / 100, // Round to 2 decimal places
      };
    });

    return {
      statistic,
      year,
      rankings,
    };
  }

  static async getDataCompleteness(statisticId: number): Promise<{
    statistic: StatisticData;
    completeness: {
      totalStates: number;
      statesWithData: number;
      coveragePercentage: number;
      yearsWithData: number[];
      lastDataYear: number | null;
      dataQuality: 'complete' | 'partial' | 'minimal';
    };
  }> {
    const db = getDb();
    const statistic = await this.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    // Get total states (excluding Nation)
    const totalStates = await db.select({ count: count() })
      .from(states)
      .where(sql`${states.name} != 'Nation'`);

    // Get states with data for this statistic
    const statesWithData = await db.select({ stateId: dataPoints.stateId })
      .from(dataPoints)
      .where(eq(dataPoints.statisticId, statisticId))
      .groupBy(dataPoints.stateId);

    // Get years with data
    const yearsWithData = await db.select({ year: dataPoints.year })
      .from(dataPoints)
      .where(eq(dataPoints.statisticId, statisticId))
      .groupBy(dataPoints.year)
      .orderBy(desc(dataPoints.year));

    const coveragePercentage = totalStates[0]?.count ? 
      (statesWithData.length / totalStates[0].count) * 100 : 0;

    let dataQuality: 'complete' | 'partial' | 'minimal';
    if (coveragePercentage >= 90) {
      dataQuality = 'complete';
    } else if (coveragePercentage >= 50) {
      dataQuality = 'partial';
    } else {
      dataQuality = 'minimal';
    }

    return {
      statistic,
      completeness: {
        totalStates: totalStates[0]?.count || 0,
        statesWithData: statesWithData.length,
        coveragePercentage: Math.round(coveragePercentage * 100) / 100,
        yearsWithData: yearsWithData.map((y: any) => y.year).sort(),
        lastDataYear: yearsWithData[0]?.year || null,
        dataQuality,
      },
    };
  }

  static async getStatisticsByDataSource(dataSourceId: number): Promise<StatisticData[]> {
    const db = getDb();
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      dataSourceName: dataSources.name,
    })
      .from(statistics)
      .leftJoin(categories, eq(statistics.categoryId, categories.id))
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .where(eq(statistics.dataSourceId, dataSourceId));

    return results.map((result: any) => ({
      id: result.id,
      name: result.name,
      raNumber: result.raNumber,
      description: result.description,
      subMeasure: result.subMeasure,
      calculation: result.calculation,
      unit: result.unit,
      availableSince: result.availableSince,
      dataQuality: 'mock',
      provenance: undefined,
      isActive: result.isActive ?? 1,
      categoryId: result.categoryId,
      dataSourceId: result.dataSourceId,
      categoryName: result.categoryName || undefined,
      dataSourceName: result.dataSourceName || undefined,
    }));
  }

  static async getStatisticsByDataQuality(quality: 'mock' | 'real'): Promise<StatisticData[]> {
    // For now, return all statistics since we don't have real data quality tracking
    // This method provides the interface for future implementation
    const allStatistics = await this.getAllStatisticsWithSources();
    return allStatistics.filter(stat => stat.dataQuality === quality);
  }

  static async getStatisticsByYearRange(startYear: string, endYear: string): Promise<StatisticData[]> {
    const db = getDb();
    const results = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      subMeasure: statistics.subMeasure,
      calculation: statistics.calculation,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      isActive: statistics.isActive,
      categoryId: statistics.categoryId,
      dataSourceId: statistics.dataSourceId,
      categoryName: categories.name,
      dataSourceName: dataSources.name,
    })
      .from(statistics)
      .leftJoin(categories, eq(statistics.categoryId, categories.id))
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .where(
        and(
          sql`${statistics.availableSince} >= ${startYear}`,
          sql`${statistics.availableSince} <= ${endYear}`
        )
      );

    return results.map((result: any) => ({
      id: result.id,
      name: result.name,
      raNumber: result.raNumber,
      description: result.description,
      subMeasure: result.subMeasure,
      calculation: result.calculation,
      unit: result.unit,
      availableSince: result.availableSince,
      dataQuality: 'mock',
      provenance: undefined,
      isActive: result.isActive ?? 1,
      categoryId: result.categoryId,
      dataSourceId: result.dataSourceId,
      categoryName: result.categoryName || undefined,
      dataSourceName: result.dataSourceName || undefined,
    }));
  }

  static async createStatistic(data: CreateStatisticInput): Promise<StatisticData> {
    const db = getDb();
    const [statistic] = await db.insert(statistics).values(data).returning();
    return {
      ...statistic,
      dataQuality: 'mock', // Default for normalized schema
      provenance: undefined, // Not available in normalized schema
      isActive: statistic.isActive ?? 1,
    };
  }

  static async updateStatistic(id: number, data: UpdateStatisticInput): Promise<StatisticData> {
    const db = getDb();
    const [statistic] = await db.update(statistics).set(data).where(eq(statistics.id, id)).returning();
    return {
      ...statistic,
      preferenceDirection: statistic.preferenceDirection || 'higher',
      dataQuality: 'mock', // Default for normalized schema
      provenance: undefined, // Not available in normalized schema
      isActive: statistic.isActive ?? 1,
    };
  }

  static async deleteStatistic(id: number): Promise<boolean> {
    const db = getDb();
    const result = await db.delete(statistics).where(eq(statistics.id, id));
    return result.changes > 0;
  }
} 