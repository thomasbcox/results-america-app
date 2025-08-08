import { getDbOrThrow } from '../db/index';
import { dataPoints, states, statistics, categories, dataSources, importSessions } from '../db/schema-postgres';
import { eq, and, inArray, between, desc, asc, count, sql } from 'drizzle-orm';
import type { 
  IDataPointsService, 
  DataPointData, 
  CreateDataPointInput, 
  UpdateDataPointInput 
} from '../types/service-interfaces';
import type { DataPointWithJoins } from '../types/database-results';

export class DataPointsService {
  static async getDataPointsForState(stateId: number, year?: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const conditions = [eq(dataPoints.stateId, stateId)];
    if (year) {
      conditions.push(eq(dataPoints.year, year));
    }
    
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      statisticName: statistics.name,
      stateName: states.name,
    })
      .from(dataPoints)
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(...conditions));

    return results.map((result: DataPointWithJoins) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      statisticName: result.statisticName || undefined,
      stateName: result.stateName || undefined,
    }));
  }

  static async getDataPointsForStatistic(statisticId: number, year?: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const conditions = [eq(dataPoints.statisticId, statisticId)];
    if (year) {
      conditions.push(eq(dataPoints.year, year));
    }
    
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(and(...conditions))
      .orderBy(states.name);

    return results.map((result: DataPointWithJoins) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  static async getDataPointsForComparison(stateIds: number[], statisticIds: number[], year: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(
        and(
          eq(dataPoints.year, year),
          inArray(dataPoints.stateId, stateIds),
          inArray(dataPoints.statisticId, statisticIds)
        )
      );

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  // NEW: Critical missing query methods for immediate business value

  static async getDataPointsByYearRange(startYear: number, endYear: number, statisticId?: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const conditions = [between(dataPoints.year, startYear, endYear)];
    if (statisticId) {
      conditions.push(eq(dataPoints.statisticId, statisticId));
    }
    
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(and(...conditions))
      .orderBy(dataPoints.year, states.name);

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  static async getDataPointsByMultipleStates(stateIds: number[], statisticId: number, year: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(
        and(
          eq(dataPoints.statisticId, statisticId),
          eq(dataPoints.year, year),
          inArray(dataPoints.stateId, stateIds)
        )
      )
      .orderBy(states.name);

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  static async getDataPointsByMultipleStatistics(statisticIds: number[], stateId: number, year: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(
        and(
          eq(dataPoints.stateId, stateId),
          eq(dataPoints.year, year),
          inArray(dataPoints.statisticId, statisticIds)
        )
      )
      .orderBy(statistics.name);

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  static async getLatestDataPoints(statisticId: number, limit: number = 10): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(eq(dataPoints.statisticId, statisticId))
      .orderBy(desc(dataPoints.year), desc(dataPoints.id))
      .limit(limit);

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  static async getDataPointsByImportSession(sessionId: number): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(eq(dataPoints.importSessionId, sessionId))
      .orderBy(dataPoints.year, states.name);

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  // NEW: Analytics methods for immediate business value

  static async getDataPointSummary(statisticId: number, year?: number): Promise<{
    count: number;
    average: number;
    min: number;
    max: number;
    totalValue: number;
  }> {
    const db = getDbOrThrow();
    const conditions = [eq(dataPoints.statisticId, statisticId)];
    if (year) {
      conditions.push(eq(dataPoints.year, year));
    }

    const result = await db.select({
      count: count(),
      average: sql<number>`AVG(${dataPoints.value})`,
      min: sql<number>`MIN(${dataPoints.value})`,
      max: sql<number>`MAX(${dataPoints.value})`,
      totalValue: sql<number>`SUM(${dataPoints.value})`,
    })
      .from(dataPoints)
      .where(and(...conditions));

    return result[0] || { count: 0, average: 0, min: 0, max: 0, totalValue: 0 };
  }

  static async getDataPointCounts(statisticId: number, year?: number): Promise<{
    totalRecords: number;
    statesWithData: number;
    yearsWithData: number[];
  }> {
    const db = getDbOrThrow();
    const conditions = [eq(dataPoints.statisticId, statisticId)];
    if (year) {
      conditions.push(eq(dataPoints.year, year));
    }

    const [totalResult, statesResult, yearsResult] = await Promise.all([
      db.select({ count: count() }).from(dataPoints).where(and(...conditions)),
      db.select({ stateId: dataPoints.stateId }).from(dataPoints).where(and(...conditions)).groupBy(dataPoints.stateId),
      db.select({ year: dataPoints.year }).from(dataPoints).where(and(...conditions)).groupBy(dataPoints.year),
    ]);

    return {
      totalRecords: totalResult[0]?.count || 0,
      statesWithData: statesResult.length,
      yearsWithData: yearsResult.map((r: any) => r.year).sort(),
    };
  }

  static async getOutliers(statisticId: number, year: number, threshold: number = 2): Promise<DataPointData[]> {
    const db = getDbOrThrow();
    
    // Get mean and standard deviation
    const stats = await db.select({
      average: sql<number>`AVG(${dataPoints.value})`,
      stddev: sql<number>`STDDEV(${dataPoints.value})`,
    })
      .from(dataPoints)
      .where(and(eq(dataPoints.statisticId, statisticId), eq(dataPoints.year, year)));

    if (!stats[0] || !stats[0].stddev) {
      return [];
    }

    const { average, stddev } = stats[0];
    const lowerBound = average - (threshold * stddev);
    const upperBound = average + (threshold * stddev);

    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(
        and(
          eq(dataPoints.statisticId, statisticId),
          eq(dataPoints.year, year),
          sql`${dataPoints.value} < ${lowerBound} OR ${dataPoints.value} > ${upperBound}`
        )
      );

    return results.map((result: any) => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      importSessionId: result.importSessionId,
      stateName: result.stateName || undefined,
      statisticName: result.statisticName || undefined,
    }));
  }

  static async createDataPoint(data: CreateDataPointInput): Promise<DataPointData> {
    const db = getDbOrThrow();
    const [dataPoint] = await db.insert(dataPoints).values(data).returning();
    return dataPoint;
  }

  static async updateDataPoint(id: number, data: UpdateDataPointInput): Promise<DataPointData> {
    const db = getDbOrThrow();
    const [dataPoint] = await db.update(dataPoints).set(data).where(eq(dataPoints.id, id)).returning();
    if (!dataPoint) {
      throw new Error(`Data point with id ${id} not found`);
    }
    return dataPoint;
  }

  static async deleteDataPoint(id: number): Promise<boolean> {
    const db = getDbOrThrow();
    const result = await db.delete(dataPoints).where(eq(dataPoints.id, id)).returning();
    return result.length > 0;
  }
} 