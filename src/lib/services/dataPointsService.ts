import { db } from '../db/index';
import { dataPoints, states, statistics, categories, dataSources, importSessions } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { 
  IDataPointsService, 
  DataPointData, 
  CreateDataPointInput, 
  UpdateDataPointInput 
} from '../types/service-interfaces';

export class DataPointsService implements IDataPointsService {
  static async getDataPointsForState(stateId: number, year?: number): Promise<DataPointData[]> {
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
      source: dataPoints.source,
      importSessionId: dataPoints.importSessionId,
      statisticName: statistics.name,
      stateName: states.name,
    })
      .from(dataPoints)
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(...conditions));

    return results.map(result => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      source: result.source,
      importSessionId: result.importSessionId,
      statisticName: result.statisticName,
      stateName: result.stateName,
    }));
  }

  static async getDataPointsForStatistic(statisticId: number, year?: number): Promise<DataPointData[]> {
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
      source: dataPoints.source,
      importSessionId: dataPoints.importSessionId,
      stateName: states.name,
      statisticName: statistics.name,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(and(...conditions))
      .orderBy(states.name);

    return results.map(result => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      source: result.source,
      importSessionId: result.importSessionId,
      stateName: result.stateName,
      statisticName: result.statisticName,
    }));
  }

  static async getDataPointsForComparison(stateIds: number[], statisticIds: number[], year: number): Promise<DataPointData[]> {
    const results = await db.select({
      id: dataPoints.id,
      statisticId: dataPoints.statisticId,
      stateId: dataPoints.stateId,
      year: dataPoints.year,
      value: dataPoints.value,
      source: dataPoints.source,
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

    return results.map(result => ({
      id: result.id,
      statisticId: result.statisticId,
      stateId: result.stateId,
      year: result.year,
      value: result.value,
      source: result.source,
      importSessionId: result.importSessionId,
      stateName: result.stateName,
      statisticName: result.statisticName,
    }));
  }

  static async createDataPoint(data: CreateDataPointInput): Promise<DataPointData> {
    const [dataPoint] = await db.insert(dataPoints).values(data).returning();
    return dataPoint;
  }

  static async updateDataPoint(id: number, data: UpdateDataPointInput): Promise<DataPointData> {
    const [dataPoint] = await db.update(dataPoints).set(data).where(eq(dataPoints.id, id)).returning();
    if (!dataPoint) {
      throw new Error(`Data point with id ${id} not found`);
    }
    return dataPoint;
  }

  static async deleteDataPoint(id: number): Promise<boolean> {
    const result = await db.delete(dataPoints).where(eq(dataPoints.id, id)).returning();
    return result.length > 0;
  }
} 