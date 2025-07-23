import { db } from '../db/index';
import { states, categories, statistics, dataPoints, dataSources, importSessions } from '../db/schema';
import { cache } from './cache';
import { eq, sql, notInArray } from 'drizzle-orm';
import { getAllStates } from './statesService';
import { getAllCategories } from './categoriesService';
import { getAllStatisticsWithSources } from './statisticsService';

export interface SystemStats {
  totalStates: number;
  totalCategories: number;
  totalStatistics: number;
  totalDataPoints: number;
  totalDataSources: number;
  totalImportSessions: number;
  lastImportDate?: string;
  cacheSize: number;
}

export interface DataIntegrityCheck {
  orphanedDataPoints: number;
  missingSources: number;
  duplicateStates: number;
  duplicateCategories: number;
  issues: string[];
}

export async function getSystemStats(): Promise<SystemStats> {
  const [
    statesCount,
    categoriesCount,
    statisticsCount,
    dataPointsCount,
    dataSourcesCount,
    importSessionsCount
  ] = await Promise.all([
    db.select({ count: states.id }).from(states).then(r => r.length),
    db.select({ count: categories.id }).from(categories).then(r => r.length),
    db.select({ count: statistics.id }).from(statistics).then(r => r.length),
    db.select({ count: dataPoints.id }).from(dataPoints).then(r => r.length),
    db.select({ count: dataSources.id }).from(dataSources).then(r => r.length),
    db.select({ count: importSessions.id }).from(importSessions).then(r => r.length)
  ]);

  // Get last import date
  const lastImport = await db.select({ importDate: importSessions.importDate })
    .from(importSessions)
    .orderBy(importSessions.importDate)
    .limit(1);

  return {
    totalStates: statesCount,
    totalCategories: categoriesCount,
    totalStatistics: statisticsCount,
    totalDataPoints: dataPointsCount,
    totalDataSources: dataSourcesCount,
    totalImportSessions: importSessionsCount,
    lastImportDate: lastImport[0]?.importDate || undefined,
    cacheSize: 0 // TODO: Implement cache size tracking
  };
}

export async function checkDataIntegrity(): Promise<DataIntegrityCheck> {
  const issues: string[] = [];
  
  // Check for orphaned data points
  const orphanedDataPoints = await db.select()
    .from(dataPoints)
    .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
    .where(sql`${statistics.id} IS NULL`)
    .then(r => r.length);

  if (orphanedDataPoints > 0) {
    issues.push(`${orphanedDataPoints} data points reference non-existent statistics`);
  }

  // Check for missing sources
  const missingSources = await db.select()
    .from(statistics)
    .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
    .where(sql`${dataSources.id} IS NULL`)
    .then(r => r.length);

  if (missingSources > 0) {
    issues.push(`${missingSources} statistics reference non-existent data sources`);
  }

  // Check for duplicate states
  const duplicateStates = await db.select({ name: states.name })
    .from(states)
    .groupBy(states.name)
    .having(sql`count(*) > 1`)
    .then(r => r.length);

  if (duplicateStates > 0) {
    issues.push(`${duplicateStates} duplicate state names found`);
  }

  // Check for duplicate categories
  const duplicateCategories = await db.select({ name: categories.name })
    .from(categories)
    .groupBy(categories.name)
    .having(sql`count(*) > 1`)
    .then(r => r.length);

  if (duplicateCategories > 0) {
    issues.push(`${duplicateCategories} duplicate category names found`);
  }

  return {
    orphanedDataPoints,
    missingSources,
    duplicateStates,
    duplicateCategories,
    issues
  };
}

export async function clearCache(): Promise<void> {
  cache.clear();
}

export async function rebuildCache(): Promise<void> {
  cache.clear();
  
  // Rebuild cache by fetching all data
  await Promise.all([
    getAllStates(db), // Don't use cache during rebuild
    getAllCategories(db), // Don't use cache during rebuild
    getAllStatisticsWithSources(db) // This doesn't use cache
  ]);
}

export async function cleanupOrphanedData(): Promise<{ cleaned: number; errors: string[] }> {
  const errors: string[] = [];
  let cleaned = 0;

  try {
    // Delete orphaned data points
    const orphanedDataPoints = await db.delete(dataPoints)
      .where(
        notInArray(
          dataPoints.statisticId,
          db.select({ id: statistics.id }).from(statistics)
        )
      );
    cleaned += orphanedDataPoints.changes || 0;
  } catch (error) {
    errors.push(`Failed to clean orphaned data points: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return { cleaned, errors };
}

 