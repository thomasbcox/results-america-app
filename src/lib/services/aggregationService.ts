import { getDataPointsForStatistic, getDataPointsForState } from './dataPointsService';
import { getAllStates } from './statesService';
import { getAllStatisticsWithSources } from './statisticsService';
import { db } from '../db/index';
import { nationalAverages, statistics } from '../db/schema';
import { eq, and } from 'drizzle-orm';

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

export interface ComparisonData {
  states: string[];
  values: number[];
  average: number;
  min: number;
  max: number;
  median: number;
}

export class NationalAverageService {
  /**
   * Get national average for a statistic and year, using stored value if available
   */
  static async getNationalAverage(statisticId: number, year: number): Promise<number> {
    // First, try to get stored value
    const stored = await this.getStoredNationalAverage(statisticId, year);
    if (stored) return stored.value;
    
    // If not stored, compute and store
    return await this.computeAndStoreNationalAverage(statisticId, year);
  }
  
  /**
   * Get stored national average from database
   */
  static async getStoredNationalAverage(statisticId: number, year: number): Promise<{ value: number; stateCount: number } | null> {
    const [average] = await db.select({
      value: nationalAverages.value,
      stateCount: nationalAverages.stateCount
    })
    .from(nationalAverages)
    .where(and(
      eq(nationalAverages.statisticId, statisticId),
      eq(nationalAverages.year, year)
    ))
    .limit(1);
    
    return average || null;
  }
  
  /**
   * Compute national average from data points and store it
   */
  static async computeAndStoreNationalAverage(statisticId: number, year: number): Promise<number> {
    const dataPoints = await getDataPointsForStatistic(statisticId, year);
    const values = dataPoints.map(dp => dp.value);
    
    if (values.length === 0) {
      throw new Error(`No data points found for statistic ${statisticId} in year ${year}`);
    }
    
    const average = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Store for future use
    await db.insert(nationalAverages).values({
      statisticId,
      year,
      value: average,
      stateCount: values.length,
      calculationMethod: 'arithmetic_mean'
    }).onConflictDoUpdate({
      target: [nationalAverages.statisticId, nationalAverages.year],
      set: {
        value: average,
        stateCount: values.length,
        lastCalculated: new Date()
      }
    });
    
    return average;
  }
  
  /**
   * Recalculate and store national averages for all statistics in a given year
   */
  static async recalculateAllNationalAverages(year: number): Promise<void> {
    const allStatistics = await getAllStatisticsWithSources();
    
    for (const stat of allStatistics) {
      try {
        await this.computeAndStoreNationalAverage(stat.id, year);
      } catch (error) {
        console.warn(`Failed to calculate national average for statistic ${stat.id} in year ${year}:`, error);
      }
    }
  }
  
  /**
   * Recalculate national averages when new data is imported
   */
  static async recalculateNationalAveragesForStatistic(statisticId: number, year: number): Promise<void> {
    try {
      await this.computeAndStoreNationalAverage(statisticId, year);
    } catch (error) {
      console.warn(`Failed to recalculate national average for statistic ${statisticId} in year ${year}:`, error);
    }
  }
}

export async function getStatisticComparison(statisticId: number, year: number = 2023): Promise<ComparisonData> {
  const dataPoints = await getDataPointsForStatistic(statisticId, year);
  
  const values = dataPoints.map(dp => dp.value);
  const states = dataPoints.map(dp => dp.stateName).filter((name): name is string => name !== null);
  
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Use the new national average service
  const average = await NationalAverageService.getNationalAverage(statisticId, year);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const median = sortedValues[Math.floor(sortedValues.length / 2)];

  return {
    states,
    values,
    average,
    min,
    max,
    median
  };
}

export async function getStateComparison(stateId: number, year: number = 2023): Promise<ChartData> {
  const dataPoints = await getDataPointsForState(stateId, year);
  
  // Group by category
  const categoryData: { [key: string]: number[] } = {};
  
  dataPoints.forEach(dp => {
    if (dp.categoryName) {
      if (!categoryData[dp.categoryName]) {
        categoryData[dp.categoryName] = [];
      }
      categoryData[dp.categoryName].push(dp.value);
    }
  });

  const labels = Object.keys(categoryData);
  const datasets = [{
    label: 'Average Values by Category',
    data: labels.map(category => {
      const values = categoryData[category];
      return values.reduce((sum, val) => sum + val, 0) / values.length;
    }),
    backgroundColor: 'rgba(59, 130, 246, 0.5)',
    borderColor: 'rgba(59, 130, 246, 1)',
  }];

  return { labels, datasets };
}

import type { StatePerformance } from '@/types/api';

export async function getTopPerformers(statisticId: number, limit: number = 10, year: number = 2023): Promise<StatePerformance[]> {
  const dataPoints = await getDataPointsForStatistic(statisticId, year);
  
  return dataPoints
    .filter(dp => dp.stateName !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(dp => ({
      name: dp.stateName!,
      code: getStateCode(dp.stateName!),
      value: dp.value,
      rank: dataPoints.findIndex(p => p.stateName === dp.stateName) + 1
    }));
}

export async function getBottomPerformers(statisticId: number, limit: number = 10, year: number = 2023): Promise<StatePerformance[]> {
  const dataPoints = await getDataPointsForStatistic(statisticId, year);
  
  return dataPoints
    .filter(dp => dp.stateName !== null)
    .sort((a, b) => a.value - b.value)
    .slice(0, limit)
    .map(dp => ({
      name: dp.stateName!,
      code: getStateCode(dp.stateName!),
      value: dp.value,
      rank: dataPoints.findIndex(p => p.stateName === dp.stateName) + 1
    }));
}

// Helper function to get state code from name
function getStateCode(stateName: string): string {
  const stateMap: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };
  return stateMap[stateName] || stateName.substring(0, 2).toUpperCase();
}

export async function getTrendData(statisticId: number, stateId: number, years: number[] = [2020, 2021, 2022, 2023]): Promise<ChartData> {
  const datasets = [];
  
  for (const year of years) {
    const dataPoints = await getDataPointsForStatistic(statisticId, year);
    // For testing, we'll just take the first data point for each year
    const stateData = dataPoints[0];
    
    if (stateData) {
      datasets.push({
        label: `Year ${year}`,
        data: [stateData.value],
        backgroundColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 0.5)`,
        borderColor: `rgba(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255}, 1)`,
      });
    }
  }

  return {
    labels: ['Value'],
    datasets
  };
} 