import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager } from '@/lib/test-infrastructure/jest-setup';
import { AnalyticsService } from './analyticsService';
import { DataPointsService } from './dataPointsService';
import { StatisticsService } from './statisticsService';
import { CategoriesService } from './categoriesService';
import { StatesService } from './statesService';

describe('AnalyticsService', () => {
  beforeEach(async () => {
    // Create fresh test database with all necessary data
    await TestDatabaseManager.createTestDatabase({
      seed: true,
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        users: true,
        importSessions: true,
        dataPoints: true
      }
    });
  });

  afterEach(() => {
    // Clean up test database
    TestDatabaseManager.cleanupTestDatabase();
  });

  describe('analyzeTrends', () => {
    it('should analyze trends for a specific statistic and state', async () => {
      const statisticId = 1;
      const stateId = 1;
      const years = [2020, 2021, 2022, 2023];

      const result = await AnalyticsService.analyzeTrends(statisticId, stateId, years);

      expect(result.statisticId).toBe(statisticId);
      expect(result.statisticName).toBeDefined();
      expect(result.trends).toBeDefined();
      expect(Array.isArray(result.trends)).toBe(true);
    });

    it('should handle non-existent statistic', async () => {
      const statisticId = 999;
      const stateId = 1;
      const years = [2023];

      await expect(
        AnalyticsService.analyzeTrends(statisticId, stateId, years)
      ).rejects.toThrow('Statistic with id 999 not found');
    });

    it('should handle non-existent state', async () => {
      const statisticId = 1;
      const stateId = 999;
      const years = [2023];

      await expect(
        AnalyticsService.analyzeTrends(statisticId, stateId, years)
      ).rejects.toThrow('State with id 999 not found');
    });
  });

  describe('compareStates', () => {
    it('should compare states for a specific statistic and year', async () => {
      const stateIds = [1, 2, 3];
      const statisticId = 1;
      const year = 2023;

      const result = await AnalyticsService.compareStates(stateIds, statisticId, year);

      expect(result.statisticId).toBe(statisticId);
      expect(result.statisticName).toBeDefined();
      expect(result.year).toBe(year);
      expect(result.states).toBeDefined();
      expect(Array.isArray(result.states)).toBe(true);
      expect(result.nationalAverage).toBeDefined();
      expect(result.median).toBeDefined();
      expect(result.standardDeviation).toBeDefined();
    });

    it('should handle non-existent statistic', async () => {
      const stateIds = [1, 2, 3];
      const statisticId = 999;
      const year = 2023;

      await expect(
        AnalyticsService.compareStates(stateIds, statisticId, year)
      ).rejects.toThrow('Statistic with id 999 not found');
    });

    it('should handle no data found', async () => {
      const stateIds = [1, 2, 3];
      const statisticId = 1;
      const year = 1900; // Year with no data

      await expect(
        AnalyticsService.compareStates(stateIds, statisticId, year)
      ).rejects.toThrow('No data found for statistic 1 in year 1900');
    });
  });

  describe('compareStatistics', () => {
    it('should compare statistics for a specific state and year', async () => {
      const statisticIds = [1, 2, 3];
      const stateId = 1;
      const year = 2023;

      const result = await AnalyticsService.compareStatistics(statisticIds, stateId, year);

      expect(result.stateId).toBe(stateId);
      expect(result.stateName).toBeDefined();
      expect(result.year).toBe(year);
      expect(result.statistics).toBeDefined();
      expect(Array.isArray(result.statistics)).toBe(true);
    });

    it('should handle non-existent state', async () => {
      const statisticIds = [1, 2, 3];
      const stateId = 999;
      const year = 2023;

      await expect(
        AnalyticsService.compareStatistics(statisticIds, stateId, year)
      ).rejects.toThrow('State with id 999 not found');
    });

    it('should handle no data found', async () => {
      const statisticIds = [1, 2, 3];
      const stateId = 1;
      const year = 1900; // Year with no data

      await expect(
        AnalyticsService.compareStatistics(statisticIds, stateId, year)
      ).rejects.toThrow('No data found for state 1 in year 1900');
    });
  });

  describe('getTopBottomPerformers', () => {
    it('should get top performers for a statistic', async () => {
      const statisticId = 1;
      const limit = 5;
      const year = 2023;
      const order = 'desc' as const;

      const result = await AnalyticsService.getTopBottomPerformers(statisticId, limit, year, order);

      expect(result.statisticId).toBe(statisticId);
      expect(result.statisticName).toBeDefined();
      expect(result.year).toBe(year);
      expect(result.performers).toBeDefined();
      expect(Array.isArray(result.performers)).toBe(true);
      expect(result.performers.length).toBeLessThanOrEqual(limit);
    });

    it('should get bottom performers for a statistic', async () => {
      const statisticId = 1;
      const limit = 5;
      const year = 2023;
      const order = 'asc' as const;

      const result = await AnalyticsService.getTopBottomPerformers(statisticId, limit, year, order);

      expect(result.statisticId).toBe(statisticId);
      expect(result.statisticName).toBeDefined();
      expect(result.year).toBe(year);
      expect(result.performers).toBeDefined();
      expect(Array.isArray(result.performers)).toBe(true);
      expect(result.performers.length).toBeLessThanOrEqual(limit);
    });

    it('should handle non-existent statistic', async () => {
      const statisticId = 999;
      const limit = 5;
      const year = 2023;
      const order = 'desc' as const;

      await expect(
        AnalyticsService.getTopBottomPerformers(statisticId, limit, year, order)
      ).rejects.toThrow('Statistic with id 999 not found');
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies in data', async () => {
      const statisticId = 1;
      const year = 2023;
      const threshold = 2;

      const result = await AnalyticsService.detectAnomalies(statisticId, year, threshold);

      expect(Array.isArray(result)).toBe(true);
      
      if (result.length > 0) {
        const anomaly = result[0];
        expect(anomaly.stateId).toBeDefined();
        expect(anomaly.stateName).toBeDefined();
        expect(anomaly.statisticId).toBe(statisticId);
        expect(anomaly.statisticName).toBeDefined();
        expect(anomaly.year).toBe(year);
        expect(anomaly.value).toBeDefined();
        expect(anomaly.expectedValue).toBeDefined();
        expect(anomaly.deviation).toBeDefined();
        expect(anomaly.deviationPercent).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(anomaly.severity);
      }
    });

    it('should handle non-existent statistic', async () => {
      const statisticId = 999;
      const year = 2023;
      const threshold = 2;

      await expect(
        AnalyticsService.detectAnomalies(statisticId, year, threshold)
      ).rejects.toThrow('Statistic with id 999 not found');
    });

    it('should return empty array for insufficient data', async () => {
      const statisticId = 1;
      const year = 1900; // Year with no data
      const threshold = 2;

      const result = await AnalyticsService.detectAnomalies(statisticId, year, threshold);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });

  describe('calculateCorrelation', () => {
    it('should calculate correlation between two statistics', async () => {
      const statisticId1 = 1;
      const statisticId2 = 2;
      const year = 2023;

      const result = await AnalyticsService.calculateCorrelation(statisticId1, statisticId2, year);

      expect(result.statisticId1).toBe(statisticId1);
      expect(result.statisticName1).toBeDefined();
      expect(result.statisticId2).toBe(statisticId2);
      expect(result.statisticName2).toBeDefined();
      expect(result.year).toBe(year);
      expect(result.correlationCoefficient).toBeDefined();
      expect(typeof result.correlationCoefficient).toBe('number');
      expect(['high', 'medium', 'low']).toContain(result.significance);
      expect(result.sampleSize).toBeDefined();
      expect(typeof result.sampleSize).toBe('number');
    });

    it('should handle non-existent statistics', async () => {
      const statisticId1 = 999;
      const statisticId2 = 2;
      const year = 2023;

      await expect(
        AnalyticsService.calculateCorrelation(statisticId1, statisticId2, year)
      ).rejects.toThrow('One or both statistics not found');
    });

    it('should handle insufficient data for correlation', async () => {
      const statisticId1 = 1;
      const statisticId2 = 2;
      const year = 1900; // Year with no data

      await expect(
        AnalyticsService.calculateCorrelation(statisticId1, statisticId2, year)
      ).rejects.toThrow('Insufficient data for correlation analysis');
    });
  });

  describe('generateReport', () => {
    it('should generate statistic summary report', async () => {
      const reportType = 'statistic-summary' as const;
      const params = { statisticId: 1, year: 2023 };

      const result = await AnalyticsService.generateReport(reportType, params);

      expect(result.id).toBeDefined();
      expect(result.type).toBe(reportType);
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(params);
    });

    it('should generate state comparison report', async () => {
      const reportType = 'state-comparison' as const;
      const params = { statisticId: 1, year: 2023 };

      const result = await AnalyticsService.generateReport(reportType, params);

      expect(result.id).toBeDefined();
      expect(result.type).toBe(reportType);
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(params);
    });

    it('should generate category overview report', async () => {
      const reportType = 'category-overview' as const;
      const params = { categoryId: 1 };

      const result = await AnalyticsService.generateReport(reportType, params);

      expect(result.id).toBeDefined();
      expect(result.type).toBe(reportType);
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(params);
    });

    it('should generate trend analysis report', async () => {
      const reportType = 'trend-analysis' as const;
      const params = { statisticId: 1, years: [2020, 2021, 2022, 2023] };

      const result = await AnalyticsService.generateReport(reportType, params);

      expect(result.id).toBeDefined();
      expect(result.type).toBe(reportType);
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(params);
    });

    it('should generate data quality report', async () => {
      const reportType = 'data-quality' as const;
      const params = { statisticId: 1 };

      const result = await AnalyticsService.generateReport(reportType, params);

      expect(result.id).toBeDefined();
      expect(result.type).toBe(reportType);
      expect(result.title).toBeDefined();
      expect(result.description).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(result.parameters).toEqual(params);
    });

    it('should handle missing required parameters', async () => {
      const reportType = 'statistic-summary' as const;
      const params = {}; // Missing statisticId

      await expect(
        AnalyticsService.generateReport(reportType, params)
      ).rejects.toThrow('statisticId is required for statistic-summary report');
    });

    it('should handle unknown report type', async () => {
      const reportType = 'unknown-report' as any;
      const params = {};

      await expect(
        AnalyticsService.generateReport(reportType, params)
      ).rejects.toThrow('Unknown report type: unknown-report');
    });
  });

  describe('exportAnalytics', () => {
    it('should export data as JSON', async () => {
      const data = { test: 'data', numbers: [1, 2, 3] };
      const format = 'json' as const;

      const result = await AnalyticsService.exportAnalytics(format, data);

      expect(result.data).toBeDefined();
      expect(result.filename).toContain('analytics-');
      expect(result.filename).toContain('.json');
      expect(result.contentType).toBe('application/json');
      
      const parsedData = JSON.parse(result.data);
      expect(parsedData).toEqual(data);
    });

    it('should export data as CSV', async () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 }
      ];
      const format = 'csv' as const;

      const result = await AnalyticsService.exportAnalytics(format, data);

      expect(result.data).toBeDefined();
      expect(result.filename).toContain('analytics-');
      expect(result.filename).toContain('.csv');
      expect(result.contentType).toBe('text/csv');
      expect(result.data).toContain('name,age');
      expect(result.data).toContain('John,30');
      expect(result.data).toContain('Jane,25');
    });

    it('should export data as PDF', async () => {
      const data = { test: 'data' };
      const format = 'pdf' as const;

      const result = await AnalyticsService.exportAnalytics(format, data);

      expect(result.data).toBeDefined();
      expect(result.filename).toContain('analytics-');
      expect(result.filename).toContain('.pdf');
      expect(result.contentType).toBe('application/pdf');
    });

    it('should handle unsupported format', async () => {
      const data = { test: 'data' };
      const format = 'unsupported' as any;

      await expect(
        AnalyticsService.exportAnalytics(format, data)
      ).rejects.toThrow('Unsupported export format: unsupported');
    });
  });
}); 