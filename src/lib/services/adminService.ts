import { db } from '../db/index';
import { states, categories, statistics, dataPoints, dataSources, importSessions } from '../db/schema';
import { cache } from './cache';
import { eq, sql, notInArray } from 'drizzle-orm';
import { StatesService } from './statesService';
import { CategoriesService } from './categoriesService';
import { StatisticsService } from './statisticsService';
import type { 
  IAdminService, 
  SystemStats, 
  DataIntegrityCheck, 
  AnalyticsData 
} from '../types/service-interfaces';

export class AdminService implements IAdminService {
  static async getSystemStats(): Promise<SystemStats> {
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

  static async checkDataIntegrity(): Promise<DataIntegrityCheck> {
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

  static async clearCache(): Promise<void> {
    cache.clear();
  }

  static async rebuildCache(): Promise<void> {
    cache.clear();
    
    // Rebuild cache by fetching all data
    await Promise.all([
      StatesService.getAllStates(false), // Don't use cache during rebuild
      CategoriesService.getAllCategories(false), // Don't use cache during rebuild
      StatisticsService.getAllStatisticsWithSources() // This doesn't use cache
    ]);
  }

  static async cleanupOrphanedData(): Promise<{ cleaned: number; errors: string[] }> {
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

  static async getAnalyticsData(range: string = '24h'): Promise<AnalyticsData> {
    // For now, return mock analytics data
    // In a real implementation, you would track requests in a separate table
    const now = new Date();
    const mockData: AnalyticsData = {
      period: range,
      metrics: {
        totalUsers: 15420,
        activeUsers: 1247,
        dataRequests: 8923,
        cacheHitRate: 78.3,
      }
    };

    return mockData;
  }
}

 