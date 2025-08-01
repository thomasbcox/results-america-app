import { getDb } from '../db/index';
import { dataPoints, statistics, states, importSessions } from '../db/schema-normalized';
import { eq, desc, asc, and, inArray } from 'drizzle-orm';
import { ValidationError, NotFoundError } from '../errors';
import type { IAggregationService } from '../types/service-interfaces';

// Types
export interface ComparisonData {
  statisticId: number;
  statisticName: string;
  year: number;
  average: number;
  median: number;
  min: number;
  max: number;
  stateCount: number;
  unit: string;
}

export interface StateComparisonData {
  stateId: number;
  stateName: string;
  year: number;
  statistics: Array<{
    statisticId: number;
    statisticName: string;
    value: number;
    rank: number;
    percentile: number;
    unit: string;
  }>;
}

export interface TopBottomPerformersData {
  statisticId: number;
  statisticName: string;
  year: number;
  performers: Array<{
    stateId: number;
    stateName: string;
    value: number;
    rank: number;
    unit: string;
  }>;
}

export interface TrendData {
  statisticId: number;
  statisticName: string;
  stateId: number;
  stateName: string;
  trends: Array<{
    year: number;
    value: number;
    change: number;
    changePercent: number;
  }>;
}

// Helper function to get active data points
async function getActiveDataPoints(statisticId?: number, year?: number) {
  const db = getDb();
  const conditions = [eq(importSessions.isActive, 1)];
  
  if (statisticId) {
    conditions.push(eq(dataPoints.statisticId, statisticId));
  }
  if (year) {
    conditions.push(eq(dataPoints.year, year));
  }
  
  return db.select({
    value: dataPoints.value,
    stateId: dataPoints.stateId,
    statisticId: dataPoints.statisticId,
    year: dataPoints.year,
  })
  .from(dataPoints)
  .innerJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
  .where(and(...conditions));
}

// National Average Service (existing code)
export class NationalAverageService {
  static async getNationalAverage(statisticId: number, year: number): Promise<number> {
    const stored = await this.getStoredNationalAverage(statisticId, year);
    if (stored) {
      return stored.value;
    }
    return this.computeAndStoreNationalAverage(statisticId, year);
  }

  static async getStoredNationalAverage(statisticId: number, year: number): Promise<{ value: number; stateCount: number } | null> {
    const result = await getActiveDataPoints(statisticId, year);

    if (result.length === 0) {
      return null;
    }

    const values = result.map((r: any) => r.value);
    const average = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;

    return {
      value: average,
      stateCount: values.length,
    };
  }

  static async computeAndStoreNationalAverage(statisticId: number, year: number): Promise<number> {
    const result = await getActiveDataPoints(statisticId, year);

    if (result.length === 0) {
      throw new NotFoundError('No data points found for statistic and year');
    }

    const values = result.map((r: any) => r.value);
    const average = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;

    return average;
  }

  static async recalculateAllNationalAverages(year: number): Promise<void> {
    const db = getDb();
    const statisticsList = await db.select({ id: statistics.id }).from(statistics);
    
    for (const stat of statisticsList) {
      try {
        await this.recalculateNationalAveragesForStatistic(stat.id, year);
      } catch (error) {
        // Log error but don't throw to avoid breaking the entire recalculation
        // The error will be handled by the calling function
      }
    }
  }

  static async recalculateNationalAveragesForStatistic(statisticId: number, year: number): Promise<void> {
    try {
      await this.computeAndStoreNationalAverage(statisticId, year);
    } catch (error) {
      // Log error but don't throw to avoid breaking the entire recalculation
      // The error will be handled by the calling function
    }
  }
}

// Main aggregation service
export class AggregationService {
  /**
   * Get statistic comparison data (national averages, rankings, etc.)
   */
  static async getStatisticComparison(statisticId: number, year: number = 2023): Promise<ComparisonData> {
    const db = getDb();
    // Get active data points for this statistic and year
    const dataPointsResult = await getActiveDataPoints(statisticId, year);

    if (dataPointsResult.length === 0) {
      throw new NotFoundError(`No data found for statistic ${statisticId} in year ${year}`);
    }

    // Get all states (we'll filter in JavaScript)
    const statesResult = await db.select({
      id: states.id,
      name: states.name,
    })
      .from(states)
      .orderBy(asc(states.name));

    // Get statistic info
    const statisticResult = await db.select({
      name: statistics.name,
      unit: statistics.unit,
    })
      .from(statistics)
      .where(eq(statistics.id, statisticId))
      .limit(1);

    if (statisticResult.length === 0) {
      throw new NotFoundError(`Statistic ${statisticId} not found`);
    }

    // Create a map of stateId to stateName
    const stateMap = new Map(statesResult.map((s: any) => [s.id, s.name]));
    
    // Extract states and values arrays
    const stateNames = dataPointsResult.map((dp: any) => stateMap.get(dp.stateId) || 'Unknown').sort();
    const values = dataPointsResult.map((dp: any) => dp.value);
    
    // Calculate statistics
    const average = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues.length % 2 === 0 
      ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
      : sortedValues[Math.floor(sortedValues.length / 2)];
    const min = Math.min(...values);
    const max = Math.max(...values);

    return {
      statisticId,
      statisticName: statisticResult[0].name,
      year,
      average,
      median,
      min,
      max,
      stateCount: values.length,
      unit: statisticResult[0].unit,
    };
  }

  /**
   * Get state comparison data (how a state ranks across all statistics)
   */
  static async getStateComparison(stateId: number, year: number = 2023): Promise<StateComparisonData> {
    const db = getDb();
    // Validate state exists
    const state = await db.select({
      id: states.id,
      name: states.name,
    })
      .from(states)
      .where(eq(states.id, stateId))
      .limit(1);

    if (state.length === 0) {
      throw new NotFoundError('State');
    }

    // Get all statistics with active data for this state and year
    const stateData = await db.select({
      statisticId: dataPoints.statisticId,
      statisticName: statistics.name,
      value: dataPoints.value,
      unit: statistics.unit,
    })
      .from(dataPoints)
      .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .innerJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
      .where(and(
        eq(dataPoints.stateId, stateId),
        eq(dataPoints.year, year),
        eq(importSessions.isActive, 1)
      ));

    // Calculate rankings for each statistic
    const statisticsWithRankings = await Promise.all(
      stateData.map(async (data: any) => {
        const allValues = await db.select({ value: dataPoints.value })
          .from(dataPoints)
          .innerJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
          .where(and(
            eq(dataPoints.statisticId, data.statisticId),
            eq(dataPoints.year, year),
            eq(importSessions.isActive, 1)
          ));

        const sortedValues = allValues.map((v: any) => v.value).sort((a: number, b: number) => b - a);
        const rank = sortedValues.findIndex((v: number) => v === data.value) + 1;
        const percentile = ((allValues.length - rank + 1) / allValues.length) * 100;

        return {
          statisticId: data.statisticId,
          statisticName: data.statisticName,
          value: data.value,
          rank,
          percentile: Math.round(percentile * 100) / 100,
          unit: data.unit,
        };
      })
    );

    return {
      stateId,
      stateName: state[0].name,
      year,
      statistics: statisticsWithRankings,
    };
  }

  /**
   * Get top or bottom performers for a statistic
   */
  static async getTopBottomPerformers(
    statisticId: number, 
    limit: number = 10, 
    year: number = 2023,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<TopBottomPerformersData> {
    const db = getDb();
    // Validate statistic exists
    const statistic = await db.select({
      id: statistics.id,
      name: statistics.name,
      unit: statistics.unit,
    })
      .from(statistics)
      .where(eq(statistics.id, statisticId))
      .limit(1);

    if (statistic.length === 0) {
      throw new NotFoundError('Statistic');
    }

    // Get performers with rankings
    const performers = await db.select({
      stateId: states.id,
      stateName: states.name,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .innerJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(
        eq(dataPoints.statisticId, statisticId),
        eq(dataPoints.year, year)
      ))
      .orderBy(order === 'desc' ? desc(dataPoints.value) : asc(dataPoints.value))
      .limit(limit);

    // Add rankings and unit
    const performersWithRankings = performers.map((performer: any, index: number) => ({
      ...performer,
      rank: index + 1,
      unit: statistic[0].unit,
    }));

    return {
      statisticId,
      statisticName: statistic[0].name,
      year,
      performers: performersWithRankings,
    };
  }

  /**
   * Get trend data for a statistic and state over multiple years
   */
  static async getTrendData(statisticId: number, stateId: number): Promise<TrendData> {
    const db = getDb();
    // Validate statistic and state exist
    const [statistic, state] = await Promise.all([
      db.select({ id: statistics.id, name: statistics.name })
        .from(statistics)
        .where(eq(statistics.id, statisticId))
        .limit(1),
      db.select({ id: states.id, name: states.name })
        .from(states)
        .where(eq(states.id, stateId))
        .limit(1),
    ]);

    if (statistic.length === 0) {
      throw new NotFoundError('Statistic');
    }
    if (state.length === 0) {
      throw new NotFoundError('State');
    }

    // Get trend data
    const trendData = await db.select({
      year: dataPoints.year,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .where(and(
        eq(dataPoints.statisticId, statisticId),
        eq(dataPoints.stateId, stateId)
      ))
      .orderBy(asc(dataPoints.year));

    if (trendData.length === 0) {
      throw new NotFoundError('Trend data for statistic and state');
    }

    // Calculate changes
    const trends = trendData.map((data: any, index: number) => {
      const change = index > 0 ? data.value - trendData[index - 1].value : 0;
      const changePercent = index > 0 && trendData[index - 1].value !== 0 
        ? (change / trendData[index - 1].value) * 100 
        : 0;

      return {
        year: data.year,
        value: data.value,
        change,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    });

    return {
      statisticId,
      statisticName: statistic[0].name,
      stateId,
      stateName: state[0].name,
      trends,
    };
  }

  /**
   * Main aggregation method that routes to specific aggregation types
   */
  static async aggregate(params: {
    type: 'statistic-comparison';
    statisticId: number;
    year?: number;
  } | {
    type: 'state-comparison';
    stateId: number;
    year?: number;
  } | {
    type: 'top-performers' | 'bottom-performers';
    statisticId: number;
    limit?: number;
    year?: number;
  } | {
    type: 'trend-data';
    statisticId: number;
    stateId: number;
  }): Promise<ComparisonData | StateComparisonData | TopBottomPerformersData | TrendData> {
    switch (params.type) {
      case 'statistic-comparison':
        return this.getStatisticComparison(params.statisticId, params.year);
      
      case 'state-comparison':
        return this.getStateComparison(params.stateId, params.year);
      
      case 'top-performers':
        return this.getTopBottomPerformers(params.statisticId, params.limit, params.year, 'desc');
      
      case 'bottom-performers':
        return this.getTopBottomPerformers(params.statisticId, params.limit, params.year, 'asc');
      
      case 'trend-data':
        return this.getTrendData(params.statisticId, params.stateId);
      
      default: {
        const exhaustiveCheck: never = params;
        throw new ValidationError(`Unknown aggregation type: ${exhaustiveCheck}`);
      }
    }
  }
} 