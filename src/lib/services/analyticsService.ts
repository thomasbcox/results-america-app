import { getDbOrThrow } from '../db/index';
import { dataPoints, statistics, states, categories } from '../db/schema-postgres';
import { eq, and, inArray, desc, asc, count, sql } from 'drizzle-orm';
import { DataPointsService } from './dataPointsService';
import { StatisticsService } from './statisticsService';
import { CategoriesService } from './categoriesService';
import { StatesService } from './statesService';

// Types for analytics results
export interface TrendAnalysis {
  statisticId: number;
  statisticName: string;
  trends: Array<{
    year: number;
    averageValue: number;
    recordCount: number;
    stateCount: number;
    changeFromPrevious: number;
    changePercent: number;
  }>;
}

export interface ComparisonData {
  statisticId: number;
  statisticName: string;
  year: number;
  states: Array<{
    stateId: number;
    stateName: string;
    value: number;
    rank: number;
    percentile: number;
  }>;
  nationalAverage: number;
  median: number;
  standardDeviation: number;
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
  }>;
}

export interface CorrelationData {
  statisticId1: number;
  statisticName1: string;
  statisticId2: number;
  statisticName2: string;
  year: number;
  correlationCoefficient: number;
  significance: 'high' | 'medium' | 'low';
  sampleSize: number;
}

export interface AnomalyData {
  stateId: number;
  stateName: string;
  statisticId: number;
  statisticName: string;
  year: number;
  value: number;
  expectedValue: number;
  deviation: number;
  deviationPercent: number;
  severity: 'high' | 'medium' | 'low';
}

export interface PredictionData {
  statisticId: number;
  statisticName: string;
  stateId: number;
  stateName: string;
  predictions: Array<{
    year: number;
    predictedValue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
    confidence: number;
  }>;
}

export interface ReportData {
  id: string;
  type: string;
  title: string;
  description: string;
  data: any;
  generatedAt: Date;
  parameters: Record<string, any>;
}

export type ReportType = 
  | 'statistic-summary'
  | 'state-comparison'
  | 'category-overview'
  | 'trend-analysis'
  | 'data-quality'
  | 'custom';

export interface ReportParams {
  statisticId?: number;
  stateId?: number;
  categoryId?: number;
  year?: number;
  years?: number[];
  limit?: number;
  filters?: Record<string, any>;
}

export class AnalyticsService {
  /**
   * Analyze trends for a specific statistic across multiple years
   */
  static async analyzeTrends(statisticId: number, stateId: number, years: number[]): Promise<TrendAnalysis> {
    const db = getDbOrThrow();
    const statistic = await StatisticsService.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    const state = await StatesService.getStateById(stateId);
    if (!state) {
      throw new Error(`State with id ${stateId} not found`);
    }

    // Get data points for this statistic and state across the years
    const points = await db.select({
      year: dataPoints.year,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .where(and(
        eq(dataPoints.statisticId, statisticId),
        eq(dataPoints.stateId, stateId),
        inArray(dataPoints.year, years)
      ))
      .orderBy(dataPoints.year);

    // Calculate trends with year-over-year changes
    const trends = points.map((point: any, index: number) => {
      const previousPoint = index > 0 ? points[index - 1] : null;
      const changeFromPrevious = previousPoint ? point.value - previousPoint.value : 0;
      const changePercent = previousPoint && previousPoint.value !== 0 ? 
        (changeFromPrevious / previousPoint.value) * 100 : 0;

      return {
        year: point.year,
        averageValue: point.value, // For single state, this is the value
        recordCount: 1,
        stateCount: 1,
        changeFromPrevious,
        changePercent: Math.round(changePercent * 100) / 100,
      };
    });

    return {
      statisticId,
      statisticName: statistic.name,
      trends,
    };
  }

  /**
   * Compare states for a specific statistic and year
   */
  static async compareStates(stateIds: number[], statisticId: number, year: number): Promise<ComparisonData> {
    const db = getDbOrThrow();
    const statistic = await StatisticsService.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    // Get data points for the specified states, statistic, and year
    const points = await db.select({
      stateId: dataPoints.stateId,
      stateName: states.name,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(
        eq(dataPoints.statisticId, statisticId),
        eq(dataPoints.year, year),
        inArray(dataPoints.stateId, stateIds)
      ))
      .orderBy(desc(dataPoints.value));

    if (points.length === 0) {
      throw new Error(`No data found for statistic ${statisticId} in year ${year}`);
    }

    // Calculate statistics
    const values = points.map((dp: any) => dp.value);
    const nationalAverage = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const sortedValues = [...values].sort((a: number, b: number) => a - b);
    const median = sortedValues.length % 2 === 0 ? 
      (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2 :
      sortedValues[Math.floor(sortedValues.length / 2)];

    // Calculate standard deviation
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - nationalAverage, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);

    // Create rankings with percentiles
    const rankings = points.map((point: any, index: number) => {
      const rank = index + 1;
      const percentile = ((rank - 1) / (points.length - 1)) * 100;
      return {
        stateId: point.stateId,
        stateName: point.stateName || 'Unknown',
        value: point.value,
        rank,
        percentile: Math.round(percentile * 100) / 100,
      };
    });

    return {
      statisticId,
      statisticName: statistic.name,
      year,
      states: rankings,
      nationalAverage: Math.round(nationalAverage * 100) / 100,
      median: Math.round(median * 100) / 100,
      standardDeviation: Math.round(standardDeviation * 100) / 100,
    };
  }

  /**
   * Compare statistics for a specific state and year
   */
  static async compareStatistics(statisticIds: number[], stateId: number, year: number): Promise<StateComparisonData> {
    const db = getDbOrThrow();
    const state = await StatesService.getStateById(stateId);
    if (!state) {
      throw new Error(`State with id ${stateId} not found`);
    }

    // Get data points for the specified statistics, state, and year
    const points = await db.select({
      statisticId: dataPoints.statisticId,
      statisticName: statistics.name,
      value: dataPoints.value,
      unit: statistics.unit,
    })
      .from(dataPoints)
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(and(
        eq(dataPoints.stateId, stateId),
        eq(dataPoints.year, year),
        inArray(dataPoints.statisticId, statisticIds)
      ))
      .orderBy(desc(dataPoints.value));

    if (points.length === 0) {
      throw new Error(`No data found for state ${stateId} in year ${year}`);
    }

    // Create rankings with percentiles
    const rankings = points.map((point: any, index: number) => {
      const rank = index + 1;
      const percentile = ((rank - 1) / (points.length - 1)) * 100;
      return {
        statisticId: point.statisticId,
        statisticName: point.statisticName || 'Unknown',
        value: point.value,
        rank,
        percentile: Math.round(percentile * 100) / 100,
        unit: point.unit || '',
      };
    });

    return {
      stateId,
      stateName: state.name,
      year,
      statistics: rankings,
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
    const db = getDbOrThrow();
    const statistic = await StatisticsService.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    // Get data points for this statistic and year, ordered by value
    const points = await db.select({
      stateId: dataPoints.stateId,
      stateName: states.name,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(eq(dataPoints.statisticId, statisticId), eq(dataPoints.year, year)))
      .orderBy(order === 'desc' ? desc(dataPoints.value) : asc(dataPoints.value))
      .limit(limit);

    // Create performers list with rankings
    const performers = points.map((point: any, index: number) => ({
      stateId: point.stateId,
      stateName: point.stateName || 'Unknown',
      value: point.value,
      rank: index + 1,
    }));

    return {
      statisticId,
      statisticName: statistic.name,
      year,
      performers,
    };
  }

  /**
   * Detect anomalies in data using statistical methods
   */
  static async detectAnomalies(statisticId: number, year: number, threshold: number = 2): Promise<AnomalyData[]> {
    const db = getDbOrThrow();
    const statistic = await StatisticsService.getStatisticById(statisticId);
    if (!statistic) {
      throw new Error(`Statistic with id ${statisticId} not found`);
    }

    // Get all data points for this statistic and year
    const points = await db.select({
      stateId: dataPoints.stateId,
      stateName: states.name,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .where(and(eq(dataPoints.statisticId, statisticId), eq(dataPoints.year, year)));

    if (points.length < 3) {
      return []; // Need at least 3 data points for anomaly detection
    }

    // Calculate mean and standard deviation
    const values = points.map((dp: any) => dp.value);
    const mean = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
    const variance = values.reduce((sum: number, val: number) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Find anomalies (values outside threshold * standard deviation)
    const anomalies = points
      .map((point: any) => {
        const deviation = Math.abs(point.value - mean);
        const deviationPercent = (deviation / mean) * 100;
        const isAnomaly = deviation > threshold * stdDev;

        if (!isAnomaly) return null;

        let severity: 'high' | 'medium' | 'low';
        if (deviationPercent > 50) {
          severity = 'high';
        } else if (deviationPercent > 25) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        return {
          stateId: point.stateId,
          stateName: point.stateName || 'Unknown',
          statisticId,
          statisticName: statistic.name,
          year,
          value: point.value,
          expectedValue: mean,
          deviation,
          deviationPercent: Math.round(deviationPercent * 100) / 100,
          severity,
        };
      })
      .filter(Boolean) as AnomalyData[];

    return anomalies;
  }

  /**
   * Calculate correlation between two statistics
   */
  static async calculateCorrelation(statisticId1: number, statisticId2: number, year: number): Promise<CorrelationData> {
    const db = getDbOrThrow();
    const [statistic1, statistic2] = await Promise.all([
      StatisticsService.getStatisticById(statisticId1),
      StatisticsService.getStatisticById(statisticId2),
    ]);

    if (!statistic1 || !statistic2) {
      throw new Error('One or both statistics not found');
    }

    // Get data points for both statistics in the same year
    const dataPoints1 = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .where(and(eq(dataPoints.statisticId, statisticId1), eq(dataPoints.year, year)));

    const dataPoints2 = await db.select({
      stateId: dataPoints.stateId,
      value: dataPoints.value,
    })
      .from(dataPoints)
      .where(and(eq(dataPoints.statisticId, statisticId2), eq(dataPoints.year, year)));

    // Create maps for easy lookup
    const map1 = new Map<number, number>(dataPoints1.map((dp: any) => [dp.stateId, dp.value]));
    const map2 = new Map<number, number>(dataPoints2.map((dp: any) => [dp.stateId, dp.value]));

    // Find common states
    const commonStates = Array.from(map1.keys()).filter(stateId => map2.has(stateId));
    
    if (commonStates.length < 2) {
      throw new Error('Insufficient data for correlation analysis');
    }

    // Calculate correlation coefficient
    const pairs: Array<{ x: number; y: number }> = commonStates.map(stateId => ({
      x: map1.get(stateId)!,
      y: map2.get(stateId)!,
    }));

    const n = pairs.length;
    const sumX = pairs.reduce((sum: number, pair: { x: number; y: number }) => sum + pair.x, 0);
    const sumY = pairs.reduce((sum: number, pair: { x: number; y: number }) => sum + pair.y, 0);
    const sumXY = pairs.reduce((sum: number, pair: { x: number; y: number }) => sum + pair.x * pair.y, 0);
    const sumX2 = pairs.reduce((sum: number, pair: { x: number; y: number }) => sum + pair.x * pair.x, 0);
    const sumY2 = pairs.reduce((sum: number, pair: { x: number; y: number }) => sum + pair.y * pair.y, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    const correlationCoefficient = denominator !== 0 ? numerator / denominator : 0;

    // Determine significance
    let significance: 'high' | 'medium' | 'low';
    const absCorrelation = Math.abs(correlationCoefficient);
    if (absCorrelation >= 0.7) {
      significance = 'high';
    } else if (absCorrelation >= 0.3) {
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
      correlationCoefficient: Math.round(correlationCoefficient * 10000) / 10000,
      significance,
      sampleSize: n,
    };
  }

  /**
   * Generate a comprehensive report
   */
  static async generateReport(reportType: ReportType, params: ReportParams): Promise<ReportData> {
    const reportId = `${reportType}-${Date.now()}`;
    let data: any;
    let title: string;
    let description: string;

    switch (reportType) {
      case 'statistic-summary':
        if (!params.statisticId) throw new Error('statisticId is required for statistic-summary report');
        const summary = await StatisticsService.getStatisticSummary(params.statisticId, params.year);
        data = summary;
        title = `Summary Report for ${summary.statistic.name}`;
        description = `Comprehensive summary of data for ${summary.statistic.name}`;
        break;

      case 'state-comparison':
        if (!params.statisticId || !params.year) {
          throw new Error('statisticId and year are required for state-comparison report');
        }
        const allStates = await StatesService.getDisplayStates();
        const stateIds = allStates.map(s => s.id);
        const comparison = await this.compareStates(stateIds, params.statisticId, params.year);
        data = comparison;
        title = `State Comparison for ${comparison.statisticName} (${comparison.year})`;
        description = `Comparison of all states for ${comparison.statisticName} in ${comparison.year}`;
        break;

      case 'category-overview':
        if (!params.categoryId) throw new Error('categoryId is required for category-overview report');
        const categoryStats = await CategoriesService.getCategoryStatistics(params.categoryId);
        data = categoryStats;
        title = `Category Overview: ${categoryStats.category.name}`;
        description = `Overview of statistics and data coverage for ${categoryStats.category.name}`;
        break;

      case 'trend-analysis':
        if (!params.statisticId || !params.years) {
          throw new Error('statisticId and years are required for trend-analysis report');
        }
        const trends = await StatisticsService.getStatisticTrends(params.statisticId, params.years);
        data = trends;
        title = `Trend Analysis for ${trends.statistic.name}`;
        description = `Trend analysis for ${trends.statistic.name} across ${params.years.length} years`;
        break;

      case 'data-quality':
        if (!params.statisticId) throw new Error('statisticId is required for data-quality report');
        const completeness = await StatisticsService.getDataCompleteness(params.statisticId);
        data = completeness;
        title = `Data Quality Report for ${completeness.statistic.name}`;
        description = `Data quality and completeness analysis for ${completeness.statistic.name}`;
        break;

      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    return {
      id: reportId,
      type: reportType,
      title,
      description,
      data,
      generatedAt: new Date(),
      parameters: params,
    };
  }

  /**
   * Export analytics data in various formats
   */
  static async exportAnalytics(format: 'csv' | 'json' | 'pdf', data: any): Promise<{
    data: string;
    filename: string;
    contentType: string;
  }> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(data, null, 2),
          filename: `analytics-${timestamp}.json`,
          contentType: 'application/json',
        };

      case 'csv':
        // Simple CSV conversion - in production, use a proper CSV library
        const csvData = this.convertToCSV(data);
        return {
          data: csvData,
          filename: `analytics-${timestamp}.csv`,
          contentType: 'text/csv',
        };

      case 'pdf':
        // For PDF, return JSON data that can be converted by the frontend
        return {
          data: JSON.stringify(data, null, 2),
          filename: `analytics-${timestamp}.pdf`,
          contentType: 'application/pdf',
        };

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert data to CSV format (simplified implementation)
   */
  private static convertToCSV(data: any): string {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      
      const headers = Object.keys(data[0]);
      const csvRows = [
        headers.join(','),
        ...data.map((row: any) => headers.map(header => `"${row[header]}"`).join(','))
      ];
      return csvRows.join('\n');
    }
    
    // For non-array data, convert to string representation
    return JSON.stringify(data);
  }
} 