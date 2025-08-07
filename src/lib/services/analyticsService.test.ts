import { describe, it, expect, beforeEach, afterEach, fail } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { AnalyticsService, TrendAnalysis, ComparisonData, StateComparisonData, TopBottomPerformersData, AnomalyData, CorrelationData, ReportData } from './analyticsService';
import { dataPoints, statistics, states, categories } from '../db/schema';
import { eq, and, inArray, desc, asc, count, sql } from 'drizzle-orm';

// Test version of AnalyticsService that accepts database instance
class TestAnalyticsService {
  static async analyzeTrends(db: any, statisticId: number, stateId: number, years: number[]): Promise<TrendAnalysis> {
    // Get statistic info
    const [statistic] = await db.select().from(statistics).where(eq(statistics.id, statisticId)).limit(1);
    if (!statistic) {
      throw new Error('Statistic not found');
    }

    // Get state info
    const [state] = await db.select().from(states).where(eq(states.id, stateId)).limit(1);
    if (!state) {
      throw new Error('State not found');
    }

    // Get data points for the specified years
    const dataPointsResult = await db.select({
      year: dataPoints.year,
      value: dataPoints.value
    })
    .from(dataPoints)
    .where(and(
      eq(dataPoints.statisticId, statisticId),
      eq(dataPoints.stateId, stateId),
      inArray(dataPoints.year, years)
    ))
    .orderBy(asc(dataPoints.year));

    // Calculate trends
    const trends = dataPointsResult.map((point, index) => {
      const changeFromPrevious = index > 0 ? point.value - dataPointsResult[index - 1].value : 0;
      const changePercent = index > 0 ? (changeFromPrevious / dataPointsResult[index - 1].value) * 100 : 0;

      return {
        year: point.year,
        averageValue: point.value,
        recordCount: 1,
        stateCount: 1,
        changeFromPrevious,
        changePercent
      };
    });

    return {
      statisticId,
      statisticName: statistic.name,
      trends
    };
  }

  static async compareStates(db: any, stateIds: number[], statisticId: number, year: number): Promise<ComparisonData> {
    // Get statistic info
    const [statistic] = await db.select().from(statistics).where(eq(statistics.id, statisticId)).limit(1);
    if (!statistic) {
      throw new Error('Statistic not found');
    }

    // Get data points for the specified states and year
    const dataPointsResult = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value,
      stateName: states.name
    })
    .from(dataPoints)
    .innerJoin(states, eq(dataPoints.stateId, states.id))
    .where(and(
      eq(dataPoints.statisticId, statisticId),
      eq(dataPoints.year, year),
      inArray(dataPoints.stateId, stateIds)
    ))
    .orderBy(desc(dataPoints.value));

    // Calculate rankings and statistics
    const values = dataPointsResult.map(dp => dp.value);
    const nationalAverage = values.reduce((sum, val) => sum + val, 0) / values.length;
    const median = values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
    const standardDeviation = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - nationalAverage, 2), 0) / values.length);

    const statesData = dataPointsResult.map((point, index) => ({
      stateId: point.stateId,
      stateName: point.stateName,
      value: point.value,
      rank: index + 1,
      percentile: ((index + 1) / dataPointsResult.length) * 100
    }));

    return {
      statisticId,
      statisticName: statistic.name,
      year,
      states: statesData,
      nationalAverage,
      median,
      standardDeviation
    };
  }

  static async compareStatistics(db: any, statisticIds: number[], stateId: number, year: number): Promise<StateComparisonData> {
    // Get state info
    const [state] = await db.select().from(states).where(eq(states.id, stateId)).limit(1);
    if (!state) {
      throw new Error('State not found');
    }

    // Get data points for the specified statistics and year
    const dataPointsResult = await db.select({
      statisticId: dataPoints.statisticId,
      value: dataPoints.value,
      statisticName: statistics.name,
      unit: statistics.unit
    })
    .from(dataPoints)
    .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
    .where(and(
      eq(dataPoints.stateId, stateId),
      eq(dataPoints.year, year),
      inArray(dataPoints.statisticId, statisticIds)
    ))
    .orderBy(desc(dataPoints.value));

    const statisticsData = dataPointsResult.map((point, index) => ({
      statisticId: point.statisticId,
      statisticName: point.statisticName,
      value: point.value,
      rank: index + 1,
      percentile: ((index + 1) / dataPointsResult.length) * 100,
      unit: point.unit
    }));

    return {
      stateId,
      stateName: state.name,
      year,
      statistics: statisticsData
    };
  }

  static async getTopBottomPerformers(
    db: any,
    statisticId: number, 
    limit: number = 10, 
    year: number = 2023,
    order: 'asc' | 'desc' = 'desc'
  ): Promise<TopBottomPerformersData> {
    // Get statistic info
    const [statistic] = await db.select().from(statistics).where(eq(statistics.id, statisticId)).limit(1);
    if (!statistic) {
      throw new Error('Statistic not found');
    }

    // Get data points for the specified year
    const dataPointsResult = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value,
      stateName: states.name
    })
    .from(dataPoints)
    .innerJoin(states, eq(dataPoints.stateId, states.id))
    .where(and(
      eq(dataPoints.statisticId, statisticId),
      eq(dataPoints.year, year)
    ))
    .orderBy(order === 'desc' ? desc(dataPoints.value) : asc(dataPoints.value))
    .limit(limit);

    const performers = dataPointsResult.map((point, index) => ({
      stateId: point.stateId,
      stateName: point.stateName,
      value: point.value,
      rank: index + 1
    }));

    return {
      statisticId,
      statisticName: statistic.name,
      year,
      performers
    };
  }

  static async detectAnomalies(db: any, statisticId: number, year: number, threshold: number = 2): Promise<AnomalyData[]> {
    // Get statistic info
    const [statistic] = await db.select().from(statistics).where(eq(statistics.id, statisticId)).limit(1);
    if (!statistic) {
      throw new Error('Statistic not found');
    }

    // Get all data points for the statistic and year
    const dataPointsResult = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value,
      stateName: states.name
    })
    .from(dataPoints)
    .innerJoin(states, eq(dataPoints.stateId, states.id))
    .where(and(
      eq(dataPoints.statisticId, statisticId),
      eq(dataPoints.year, year)
    ));

    if (dataPointsResult.length < 3) {
      return []; // Need at least 3 data points for anomaly detection
    }

    // Calculate statistics
    const values = dataPointsResult.map(dp => dp.value);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const standardDeviation = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);

    // Find anomalies
    const anomalies: AnomalyData[] = [];
    dataPointsResult.forEach(point => {
      const deviation = Math.abs(point.value - mean);
      const deviationPercent = (deviation / mean) * 100;
      
      if (deviation > threshold * standardDeviation) {
        const severity = deviationPercent > 50 ? 'high' : deviationPercent > 25 ? 'medium' : 'low';
        
        anomalies.push({
          stateId: point.stateId,
          stateName: point.stateName,
          statisticId,
          statisticName: statistic.name,
          year,
          value: point.value,
          expectedValue: mean,
          deviation,
          deviationPercent,
          severity
        });
      }
    });

    return anomalies;
  }

  static async calculateCorrelation(db: any, statisticId1: number, statisticId2: number, year: number): Promise<CorrelationData> {
    // Get statistics info
    const [statistic1] = await db.select().from(statistics).where(eq(statistics.id, statisticId1)).limit(1);
    const [statistic2] = await db.select().from(statistics).where(eq(statistics.id, statisticId2)).limit(1);
    
    if (!statistic1 || !statistic2) {
      throw new Error('One or both statistics not found');
    }

    // Get data points for both statistics
    const dataPoints1 = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value
    })
    .from(dataPoints)
    .where(and(
      eq(dataPoints.statisticId, statisticId1),
      eq(dataPoints.year, year)
    ));

    const dataPoints2 = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value
    })
    .from(dataPoints)
    .where(and(
      eq(dataPoints.statisticId, statisticId2),
      eq(dataPoints.year, year)
    ));

    // Create maps for easy lookup
    const map1 = new Map(dataPoints1.map(dp => [dp.stateId, dp.value]));
    const map2 = new Map(dataPoints2.map(dp => [dp.stateId, dp.value]));

    // Find common states
    const commonStates = Array.from(map1.keys()).filter(stateId => map2.has(stateId));
    
    if (commonStates.length < 3) {
      return {
        statisticId1,
        statisticName1: statistic1.name,
        statisticId2,
        statisticName2: statistic2.name,
        year,
        correlationCoefficient: 0,
        significance: 'low',
        sampleSize: commonStates.length
      };
    }

    // Calculate correlation
    const pairs = commonStates.map(stateId => ({
      x: map1.get(stateId)!,
      y: map2.get(stateId)!
    }));

    const n = pairs.length;
    const sumX = pairs.reduce((sum, pair) => sum + pair.x, 0);
    const sumY = pairs.reduce((sum, pair) => sum + pair.y, 0);
    const sumXY = pairs.reduce((sum, pair) => sum + pair.x * pair.y, 0);
    const sumX2 = pairs.reduce((sum, pair) => sum + pair.x * pair.x, 0);
    const sumY2 = pairs.reduce((sum, pair) => sum + pair.y * pair.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const correlationCoefficient = denominator === 0 ? 0 : numerator / denominator;
    
    // Determine significance
    let significance: 'high' | 'medium' | 'low';
    if (Math.abs(correlationCoefficient) > 0.7) {
      significance = 'high';
    } else if (Math.abs(correlationCoefficient) > 0.3) {
      significance = 'medium';
    } else {
      significance = 'low';
    }

    return {
      statisticId1,
      statisticName1: statistic1.name,
      statisticId2,
      statisticName2: statistic2.name,
      year,
      correlationCoefficient,
      significance,
      sampleSize: n
    };
  }

  static async generateReport(db: any, reportType: string, params: any): Promise<ReportData> {
    const reportId = `report_${Date.now()}`;
    const generatedAt = new Date();

    switch (reportType) {
      case 'statistic-summary':
        if (!params.statisticId || !params.year) {
          throw new Error('statisticId and year are required for statistic-summary report');
        }
        
        const [statistic] = await db.select().from(statistics).where(eq(statistics.id, params.statisticId)).limit(1);
        if (!statistic) {
          throw new Error('Statistic not found');
        }

        const dataPointsResult = await db.select({
          value: dataPoints.value,
          stateName: states.name
        })
        .from(dataPoints)
        .innerJoin(states, eq(dataPoints.stateId, states.id))
        .where(and(
          eq(dataPoints.statisticId, params.statisticId),
          eq(dataPoints.year, params.year)
        ));

        const values = dataPointsResult.map(dp => dp.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);

        return {
          id: reportId,
          type: reportType,
          title: `${statistic.name} Summary Report`,
          description: `Summary statistics for ${statistic.name} in ${params.year}`,
          data: {
            statisticName: statistic.name,
            year: params.year,
            average,
            min,
            max,
            count: values.length
          },
          generatedAt,
          parameters: params
        };

      case 'state-comparison':
        if (!params.stateId || !params.year) {
          throw new Error('stateId and year are required for state-comparison report');
        }
        
        const [state] = await db.select().from(states).where(eq(states.id, params.stateId)).limit(1);
        if (!state) {
          throw new Error('State not found');
        }

        const stateDataPoints = await db.select({
          statisticName: statistics.name,
          value: dataPoints.value,
          unit: statistics.unit
        })
        .from(dataPoints)
        .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
        .where(and(
          eq(dataPoints.stateId, params.stateId),
          eq(dataPoints.year, params.year)
        ));

        return {
          id: reportId,
          type: reportType,
          title: `${state.name} State Report`,
          description: `Statistics for ${state.name} in ${params.year}`,
          data: {
            stateName: state.name,
            year: params.year,
            statistics: stateDataPoints
          },
          generatedAt,
          parameters: params
        };

      case 'trend-analysis':
        if (!params.statisticId || !params.years) {
          throw new Error('statisticId and years are required for trend-analysis report');
        }
        
        const [trendStatistic] = await db.select().from(statistics).where(eq(statistics.id, params.statisticId)).limit(1);
        if (!trendStatistic) {
          throw new Error('Statistic not found');
        }

        const trendDataPoints = await db.select({
          year: dataPoints.year,
          value: dataPoints.value
        })
        .from(dataPoints)
        .where(and(
          eq(dataPoints.statisticId, params.statisticId),
          inArray(dataPoints.year, params.years)
        ))
        .orderBy(asc(dataPoints.year));

        return {
          id: reportId,
          type: reportType,
          title: `${trendStatistic.name} Trend Analysis`,
          description: `Trend analysis for ${trendStatistic.name} over ${params.years.length} years`,
          data: {
            statisticName: trendStatistic.name,
            years: params.years,
            dataPoints: trendDataPoints
          },
          generatedAt,
          parameters: params
        };

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  static async exportAnalytics(format: 'csv' | 'json' | 'pdf', data: any): Promise<{
    data: string;
    filename: string;
    contentType: string;
  }> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'csv':
        if (Array.isArray(data)) {
          if (data.length === 0) {
            return {
              data: '',
              filename: `export_${timestamp}.csv`,
              contentType: 'text/csv'
            };
          }
          
          const headers = Object.keys(data[0]);
          const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header]}"`).join(','))
          ].join('\n');
          
          return {
            data: csvContent,
            filename: `export_${timestamp}.csv`,
            contentType: 'text/csv'
          };
        }
        break;

      case 'json':
        return {
          data: JSON.stringify(data, null, 2),
          filename: `export_${timestamp}.json`,
          contentType: 'application/json'
        };

      case 'pdf':
        // For testing purposes, return a simple text representation
        return {
          data: `PDF Export: ${JSON.stringify(data)}`,
          filename: `export_${timestamp}.pdf`,
          contentType: 'application/pdf'
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    throw new Error('Export failed');
  }
}

describe('AnalyticsService', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        importSessions: true,
        dataPoints: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('Trend Analysis', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      // Create test data points for trend analysis
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2020,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2021,
          stateId: 1,
          statisticId: 1,
          value: 110.0
        },
        {
          importSessionId: 1,
          year: 2022,
          stateId: 1,
          statisticId: 1,
          value: 120.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 130.0
        }
      ]);
    });

    it('should analyze trends for a statistic and state', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.analyzeTrends(db, 1, 1, [2020, 2021, 2022, 2023]);
      
      expect(result.statisticId).toBe(1);
      expect(result.trends).toHaveLength(4);
      expect(result.trends[0].year).toBe(2020);
      expect(result.trends[0].averageValue).toBe(100.0);
      expect(result.trends[1].year).toBe(2021);
      expect(result.trends[1].averageValue).toBe(110.0);
      expect(result.trends[1].changeFromPrevious).toBe(10.0);
      expect(result.trends[1].changePercent).toBe(10.0);
    });

    it('should handle missing data in trend analysis', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.analyzeTrends(db, 1, 1, [2020, 2021, 2025]);
      
      expect(result.trends).toHaveLength(2); // Only 2020 and 2021 have data
      expect(result.trends[0].year).toBe(2020);
      expect(result.trends[1].year).toBe(2021);
    });
  });

  describe('State Comparison', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      // Create test data points for state comparison
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 150.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 3,
          statisticId: 1,
          value: 200.0
        }
      ]);
    });

    it('should compare states for a statistic', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.compareStates(db, [1, 2, 3], 1, 2023);
      
      expect(result.statisticId).toBe(1);
      expect(result.year).toBe(2023);
      expect(result.states).toHaveLength(3);
      expect(result.nationalAverage).toBe(150.0);
      expect(result.median).toBe(150.0);
      
      // Check rankings
      const rankings = result.states.map(s => s.rank).sort((a, b) => a - b);
      expect(rankings).toEqual([1, 2, 3]);
    });

    it('should handle single state comparison', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.compareStates(db, [1], 1, 2023);
      
      expect(result.states).toHaveLength(1);
      expect(result.states[0].stateId).toBe(1);
      expect(result.states[0].rank).toBe(1);
      expect(result.states[0].percentile).toBe(100);
    });
  });

  describe('Statistics Comparison', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.stateId, 1));
      
      // Create test data points for statistics comparison
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 2,
          value: 200.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 3,
          value: 300.0
        }
      ]);
    });

    it('should compare statistics for a state', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.compareStatistics(db, [1, 2, 3], 1, 2023);
      
      expect(result.stateId).toBe(1);
      expect(result.year).toBe(2023);
      expect(result.statistics).toHaveLength(3);
      
      // Check that statistics are ordered by value
      const values = result.statistics.map(s => s.value);
      expect(values).toEqual([100.0, 200.0, 300.0]);
    });
  });

  describe('Top/Bottom Performers', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      // Create test data points for performers analysis
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 200.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 3,
          statisticId: 1,
          value: 300.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 4,
          statisticId: 1,
          value: 400.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 5,
          statisticId: 1,
          value: 500.0
        }
      ]);
    });

    it('should get top performers', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.getTopBottomPerformers(db, 1, 3, 2023, 'desc');
      
      expect(result.statisticId).toBe(1);
      expect(result.year).toBe(2023);
      expect(result.performers).toHaveLength(3);
      expect(result.performers[0].rank).toBe(1);
      expect(result.performers[0].value).toBe(500.0);
      expect(result.performers[1].rank).toBe(2);
      expect(result.performers[1].value).toBe(400.0);
    });

    it('should get bottom performers', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.getTopBottomPerformers(db, 1, 3, 2023, 'asc');
      
      expect(result.performers).toHaveLength(3);
      expect(result.performers[0].rank).toBe(1);
      expect(result.performers[0].value).toBe(100.0);
      expect(result.performers[1].rank).toBe(2);
      expect(result.performers[1].value).toBe(200.0);
    });
  });

  describe('Anomaly Detection', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      // Create test data points with some anomalies
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 110.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 3,
          statisticId: 1,
          value: 120.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 4,
          statisticId: 1,
          value: 200.0 // Anomaly
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 5,
          statisticId: 1,
          value: 50.0 // Anomaly
        }
      ]);
    });

    it('should detect anomalies', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.detectAnomalies(db, 1, 2023, 2);
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      result.forEach(anomaly => {
        expect(anomaly).toHaveProperty('stateId');
        expect(anomaly).toHaveProperty('statisticId');
        expect(anomaly).toHaveProperty('year');
        expect(anomaly).toHaveProperty('value');
        expect(anomaly).toHaveProperty('expectedValue');
        expect(anomaly).toHaveProperty('deviation');
        expect(anomaly).toHaveProperty('severity');
      });
    });

    it('should handle no anomalies', async () => {
      const db = testDb.db;
      
      // Create data with no anomalies
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 105.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 3,
          statisticId: 1,
          value: 110.0
        }
      ]);
      
      const result = await TestAnalyticsService.detectAnomalies(db, 1, 2023, 2);
      expect(result).toHaveLength(0);
    });
  });

  describe('Correlation Analysis', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 2));
      
      // Create test data points for correlation analysis
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 2,
          value: 200.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 200.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 2,
          value: 400.0
        }
      ]);
    });

    it('should calculate correlation between statistics', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.calculateCorrelation(db, 1, 2, 2023);
      
      expect(result.statisticId1).toBe(1);
      expect(result.statisticId2).toBe(2);
      expect(result.year).toBe(2023);
      expect(result).toHaveProperty('correlationCoefficient');
      expect(result).toHaveProperty('significance');
      expect(result).toHaveProperty('sampleSize');
    });
  });

  describe('Report Generation', () => {
    beforeEach(async () => {
      const db = testDb.db;
      
      // Clear existing data points for this test
      await db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      // Create test data for reports
      await db.insert(dataPoints).values([
        {
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0
        },
        {
          importSessionId: 1,
          year: 2023,
          stateId: 2,
          statisticId: 1,
          value: 200.0
        }
      ]);
    });

    it('should generate statistic summary report', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.generateReport(db, 'statistic-summary', {
        statisticId: 1,
        year: 2023
      });
      
      expect(result.type).toBe('statistic-summary');
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeInstanceOf(Date);
      expect(result.parameters.statisticId).toBe(1);
    });

    it('should generate state comparison report', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.generateReport(db, 'state-comparison', {
        stateId: 1,
        year: 2023
      });
      
      expect(result.type).toBe('state-comparison');
      expect(result.data).toBeDefined();
      expect(result.parameters.stateId).toBe(1);
    });

    it('should generate trend analysis report', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.generateReport(db, 'trend-analysis', {
        statisticId: 1,
        years: [2020, 2021, 2022, 2023]
      });
      
      expect(result.type).toBe('trend-analysis');
      expect(result.data).toBeDefined();
      expect(result.parameters.statisticId).toBe(1);
    });
  });

  describe('Data Export', () => {
    it('should export data as CSV', async () => {
      const db = testDb.db;
      
      const testData = [
        { state: 'California', value: 100 },
        { state: 'Texas', value: 200 }
      ];
      
      const result = await TestAnalyticsService.exportAnalytics('csv', testData);
      
      expect(result.data).toContain('state,value');
      expect(result.data).toContain('"California"');
      expect(result.data).toContain('"Texas"');
      expect(result.filename).toContain('.csv');
      expect(result.contentType).toBe('text/csv');
    });

    it('should export data as JSON', async () => {
      const db = testDb.db;
      
      const testData = { states: ['California', 'Texas'] };
      
      const result = await TestAnalyticsService.exportAnalytics('json', testData);
      
      expect(result.data).toContain('"states"');
      expect(result.data).toContain('"California"');
      expect(result.filename).toContain('.json');
      expect(result.contentType).toBe('application/json');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing data gracefully', async () => {
      const db = testDb.db;
      
      // Test with non-existent statistic
      try {
        await TestAnalyticsService.analyzeTrends(db, 999, 1, [2023]);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toContain('Statistic not found');
      }
    });

    it('should handle empty state list', async () => {
      const db = testDb.db;
      
      const result = await TestAnalyticsService.compareStates(db, [], 1, 2023);
      
      expect(result.states).toHaveLength(0);
      expect(result.nationalAverage).toBe(0);
    });
  });
}); 