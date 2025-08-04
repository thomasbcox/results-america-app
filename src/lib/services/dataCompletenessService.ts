import { getDb } from '../db/index';
import { 
  statistics, 
  dataPoints, 
  categories, 
  importSessions, 
  csvImportStaging,
  states 
} from '../db/schema';
import { eq, and, count, sql, inArray, isNull, isNotNull } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export interface DataCompletenessReport {
  categories: CategoryCompleteness[];
  summary: CompletenessSummary;
  filters: CompletenessFilters;
}

export interface CategoryCompleteness {
  id: number;
  name: string;
  metrics: MetricCompleteness[];
  totalMetrics: number;
  metricsWithData: number;
  coveragePercentage: number;
}

export interface MetricCompleteness {
  id: number;
  name: string;
  raNumber: string | null;
  unit: string;
  years: YearCompleteness[];
  totalYears: number;
  yearsWithData: number;
  coveragePercentage: number;
}

export interface YearCompleteness {
  year: number;
  productionStates: number;
  stagedStates: number;
  overlapStates: number;
  totalStates: number;
  coveragePercentage: number;
  hasOverlap: boolean;
}

export interface CompletenessSummary {
  totalCategories: number;
  totalMetrics: number;
  totalYears: number;
  totalStates: number;
  categoriesWithData: number;
  metricsWithData: number;
  yearsWithData: number;
  overallCoveragePercentage: number;
}

export interface CompletenessFilters {
  categoryId?: number;
  metricId?: number;
  year?: number;
  dataState?: 'production' | 'staged' | 'overlap' | 'incomplete';
  showIncompleteOnly?: boolean;
  showStagedOnly?: boolean;
}

export class DataCompletenessService {
  /**
   * Get comprehensive data completeness report
   */
  static async getCompletenessReport(filters: CompletenessFilters = {}): Promise<DataCompletenessReport> {
    const db = getDb();
    
    // Get all categories
    const allCategories = await db.select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .where(eq(categories.isActive, 1))
    .orderBy(categories.name);

    // Get all states for total count (excluding "Nation")
    const allStates = await db.select({ id: states.id, name: states.name })
      .from(states)
      .where(and(
        eq(states.isActive, 1),
        sql`${states.name} != 'Nation'`
      ));
    const totalStates = allStates.length;

    // Get all statistics with their categories
    const allStatistics = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      unit: statistics.unit,
      categoryId: statistics.categoryId,
      categoryName: categories.name,
    })
    .from(statistics)
    .leftJoin(categories, eq(statistics.categoryId, categories.id))
    .where(eq(statistics.isActive, 1))
    .orderBy(statistics.name);

    // Get production data points (from active import sessions)
    const productionData = await db.select({
      statisticId: dataPoints.statisticId,
      year: dataPoints.year,
      stateId: dataPoints.stateId,
    })
    .from(dataPoints)
    .innerJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
    .where(eq(importSessions.isActive, 1));

    // Get staged data points (from csv_import_staging where is_processed = 0)
    const stagedData = await db.select({
      statisticId: csvImportStaging.statisticId,
      year: csvImportStaging.year,
      stateId: csvImportStaging.stateId,
    })
    .from(csvImportStaging)
    .where(eq(csvImportStaging.isProcessed, 0));

    // Process data into categories
    const categoriesData: CategoryCompleteness[] = [];
    
    for (const category of allCategories) {
      // Filter statistics for this category
      const categoryStats = allStatistics.filter(stat => stat.categoryId === category.id);
      
      if (filters.categoryId && category.id !== filters.categoryId) {
        continue;
      }

      const metrics: MetricCompleteness[] = [];
      
      for (const stat of categoryStats) {
        if (filters.metricId && stat.id !== filters.metricId) {
          continue;
        }

        // Get production data for this statistic
        const statProductionData = productionData.filter(dp => dp.statisticId === stat.id);
        
        // Get staged data for this statistic
        const statStagedData = stagedData.filter(dp => dp.statisticId === stat.id);
        
        // Group by year
        const years = new Map<number, YearCompleteness>();
        
        // Process production data
        for (const dp of statProductionData) {
          if (filters.year && dp.year !== filters.year) {
            continue;
          }
          
          if (!years.has(dp.year)) {
            years.set(dp.year, {
              year: dp.year,
              productionStates: 0,
              stagedStates: 0,
              overlapStates: 0,
              totalStates: totalStates,
              coveragePercentage: 0,
              hasOverlap: false,
            });
          }
          
          const yearData = years.get(dp.year)!;
          yearData.productionStates++;
        }
        
        // Process staged data
        for (const dp of statStagedData) {
          if (filters.year && dp.year !== filters.year) {
            continue;
          }
          
          if (!years.has(dp.year)) {
            years.set(dp.year, {
              year: dp.year,
              productionStates: 0,
              stagedStates: 0,
              overlapStates: 0,
              totalStates: totalStates,
              coveragePercentage: 0,
              hasOverlap: false,
            });
          }
          
          const yearData = years.get(dp.year)!;
          yearData.stagedStates++;
          
          // Check for overlap (both production and staged data for same state-year)
          const hasProduction = statProductionData.some(pd => 
            pd.year === dp.year && pd.stateId === dp.stateId
          );
          
          if (hasProduction) {
            yearData.overlapStates++;
            yearData.hasOverlap = true;
          }
        }
        
        // Calculate coverage percentages
        for (const yearData of years.values()) {
          const totalCovered = yearData.productionStates + yearData.stagedStates - yearData.overlapStates;
          yearData.coveragePercentage = Math.round((totalCovered / yearData.totalStates) * 100);
        }
        
        // Filter by data state if specified
        if (filters.dataState) {
          const filteredYears = new Map<number, YearCompleteness>();
          
          for (const [year, yearData] of years) {
            let include = false;
            
            switch (filters.dataState) {
              case 'production':
                include = yearData.productionStates > 0;
                break;
              case 'staged':
                include = yearData.stagedStates > 0;
                break;
              case 'overlap':
                include = yearData.hasOverlap;
                break;
              case 'incomplete':
                include = yearData.coveragePercentage < 100;
                break;
            }
            
            if (include) {
              filteredYears.set(year, yearData);
            }
          }
          
          years.clear();
          filteredYears.forEach((value, key) => years.set(key, value));
        }
        
        // Filter by incomplete only
        if (filters.showIncompleteOnly) {
          const hasIncompleteYears = Array.from(years.values()).some(year => year.coveragePercentage < 100);
          if (!hasIncompleteYears) {
            continue;
          }
        }
        
        // Filter by staged only
        if (filters.showStagedOnly) {
          const hasStagedData = Array.from(years.values()).some(year => year.stagedStates > 0);
          if (!hasStagedData) {
            continue;
          }
        }
        
        const yearsArray = Array.from(years.values()).sort((a, b) => a.year - b.year);
        const yearsWithData = yearsArray.filter(year => 
          year.productionStates > 0 || year.stagedStates > 0
        ).length;
        
        const metric: MetricCompleteness = {
          id: stat.id,
          name: stat.name,
          raNumber: stat.raNumber,
          unit: stat.unit,
          years: yearsArray,
          totalYears: yearsArray.length,
          yearsWithData,
          coveragePercentage: yearsArray.length > 0 
            ? Math.round((yearsWithData / yearsArray.length) * 100)
            : 0,
        };
        
        metrics.push(metric);
      }
      
      if (metrics.length === 0) {
        continue;
      }
      
      const metricsWithData = metrics.filter(m => m.yearsWithData > 0).length;
      
      const categoryData: CategoryCompleteness = {
        id: category.id,
        name: category.name,
        metrics,
        totalMetrics: metrics.length,
        metricsWithData,
        coveragePercentage: metrics.length > 0 
          ? Math.round((metricsWithData / metrics.length) * 100)
          : 0,
      };
      
      categoriesData.push(categoryData);
    }
    
    // Calculate summary
    const summary = this.calculateSummary(categoriesData, totalStates);
    
    return {
      categories: categoriesData,
      summary,
      filters,
    };
  }
  
  /**
   * Calculate overall summary statistics
   */
  private static calculateSummary(categories: CategoryCompleteness[], totalStates: number): CompletenessSummary {
    const totalCategories = categories.length;
    const totalMetrics = categories.reduce((sum, cat) => sum + cat.totalMetrics, 0);
    
    // Calculate unique years across all metrics (not sum of per-metric counts)
    const allYears = new Set<number>();
    const allYearsWithData = new Set<number>();
    
    categories.forEach(category => {
      category.metrics.forEach(metric => {
        metric.years.forEach(year => {
          allYears.add(year.year);
          if (year.productionStates > 0 || year.stagedStates > 0) {
            allYearsWithData.add(year.year);
          }
        });
      });
    });
    
    const totalYears = allYears.size;
    const yearsWithData = allYearsWithData.size;
    
    const categoriesWithData = categories.filter(cat => cat.metricsWithData > 0).length;
    const metricsWithData = categories.reduce((sum, cat) => sum + cat.metricsWithData, 0);
    
    const overallCoveragePercentage = totalMetrics > 0 
      ? Math.round((metricsWithData / totalMetrics) * 100)
      : 0;
    
    return {
      totalCategories,
      totalMetrics,
      totalYears,
      totalStates,
      categoriesWithData,
      metricsWithData,
      yearsWithData,
      overallCoveragePercentage,
    };
  }
  
  /**
   * Get data freshness report (when data was last updated)
   */
  static async getDataFreshnessReport(): Promise<any> {
    const db = getDb();
    
    // Get latest import dates for each statistic
    const latestImports = await db.select({
      statisticId: dataPoints.statisticId,
      statisticName: statistics.name,
      latestImportDate: sql<string>`MAX(${importSessions.importDate})`,
      dataYear: dataPoints.year,
    })
    .from(dataPoints)
    .innerJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
    .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
    .where(eq(importSessions.isActive, 1))
    .groupBy(dataPoints.statisticId, dataPoints.year);
    
    // Get staged data freshness
    const stagedFreshness = await db.select({
      statisticId: csvImportStaging.statisticId,
      statisticName: statistics.name,
      stagedDate: sql<string>`MAX(${csvImportStaging.processedAt})`,
      dataYear: csvImportStaging.year,
    })
    .from(csvImportStaging)
    .innerJoin(statistics, eq(csvImportStaging.statisticId, statistics.id))
    .where(eq(csvImportStaging.isProcessed, 0))
    .groupBy(csvImportStaging.statisticId, csvImportStaging.year);
    
    return {
      production: latestImports,
      staged: stagedFreshness,
    };
  }
  
  /**
   * Get overlap analysis (where staged data exists for production data)
   */
  static async getOverlapAnalysis(): Promise<any> {
    const db = getDb();
    
    // Find cases where staged data overlaps with production data
    const overlaps = await db.select({
      statisticId: csvImportStaging.statisticId,
      statisticName: statistics.name,
      year: csvImportStaging.year,
      stateId: csvImportStaging.stateId,
      stateName: states.name,
      stagedValue: csvImportStaging.value,
      productionValue: dataPoints.value,
      difference: sql<string>`ABS(${csvImportStaging.value} - ${dataPoints.value})`,
    })
    .from(csvImportStaging)
    .innerJoin(statistics, eq(csvImportStaging.statisticId, statistics.id))
    .innerJoin(states, eq(csvImportStaging.stateId, states.id))
    .innerJoin(dataPoints, and(
      eq(csvImportStaging.statisticId, dataPoints.statisticId),
      eq(csvImportStaging.year, dataPoints.year),
      eq(csvImportStaging.stateId, dataPoints.stateId)
    ))
    .innerJoin(importSessions, eq(dataPoints.importSessionId, importSessions.id))
    .where(and(
      eq(csvImportStaging.isProcessed, 0),
      eq(importSessions.isActive, 1)
    ));
    
    return {
      overlaps,
      totalOverlaps: overlaps.length,
      averageDifference: overlaps.length > 0 
        ? overlaps.reduce((sum, o) => sum + parseFloat(o.difference), 0) / overlaps.length
        : 0,
    };
  }
} 