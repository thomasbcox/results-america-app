import { db } from '../db/index';
import { dataPoints, states, statistics, categories, dataSources, importSessions } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function getDataPointsForState(stateId: number, year?: number, database = db) {
  const conditions = [eq(dataPoints.stateId, stateId)];
  if (year) {
    conditions.push(eq(dataPoints.year, year));
  }
  
  return database.select({
    id: dataPoints.id,
    value: dataPoints.value,
    year: dataPoints.year,
    statisticName: statistics.name,
    statisticUnit: statistics.unit,
    categoryName: categories.name,
    sourceName: dataSources.name,
    sourceUrl: dataSources.url,
    importDate: importSessions.importDate,
  })
    .from(dataPoints)
    .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
    .leftJoin(categories, eq(statistics.categoryId, categories.id))
    .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
    .leftJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
    .where(and(...conditions));
}

export async function getDataPointsForStatistic(statisticId: number, year?: number, database = db) {
  const conditions = [eq(dataPoints.statisticId, statisticId)];
  if (year) {
    conditions.push(eq(dataPoints.year, year));
  }
  
  return database.select({
    id: dataPoints.id,
    value: dataPoints.value,
    year: dataPoints.year,
    stateName: states.name,
    stateAbbreviation: states.abbreviation,
  })
    .from(dataPoints)
    .leftJoin(states, eq(dataPoints.stateId, states.id))
    .where(and(...conditions))
    .orderBy(states.name);
}

export async function getDataPointsForComparison(stateIds: number[], statisticIds: number[], year: number, database = db) {
  return database.select({
    id: dataPoints.id,
    value: dataPoints.value,
    year: dataPoints.year,
    stateName: states.name,
    stateAbbreviation: states.abbreviation,
    statisticName: statistics.name,
    statisticUnit: statistics.unit,
    categoryName: categories.name,
  })
    .from(dataPoints)
    .leftJoin(states, eq(dataPoints.stateId, states.id))
    .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
    .leftJoin(categories, eq(statistics.categoryId, categories.id))
    .where(
      and(
        eq(dataPoints.year, year),
        // Note: This would need to be expanded for multiple states/statistics
        // For now, this is a simplified version
      )
    );
}

export async function createDataPoint(data: { importSessionId: number; year: number; stateId: number; statisticId: number; value: number }, database = db) {
  return database.insert(dataPoints).values(data).returning();
}

export async function updateDataPoint(id: number, data: Partial<{ value: number }>, database = db) {
  return database.update(dataPoints).set(data).where(eq(dataPoints.id, id)).returning();
}

export async function deleteDataPoint(id: number, database = db) {
  return database.delete(dataPoints).where(eq(dataPoints.id, id)).returning();
} 