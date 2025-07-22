import { getDataPointsForStatistic, getDataPointsForState } from './dataPointsService';
import { getAllStates } from './statesService';
import { getAllStatisticsWithSources } from './statisticsService';

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

export async function getStatisticComparison(statisticId: number, year: number = 2023): Promise<ComparisonData> {
  const dataPoints = await getDataPointsForStatistic(statisticId, year);
  
  const values = dataPoints.map(dp => dp.value);
  const states = dataPoints.map(dp => dp.stateName);
  
  const sortedValues = [...values].sort((a, b) => a - b);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
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
  const statistics = await getAllStatisticsWithSources();
  
  // Group by category
  const categoryData: { [key: string]: number[] } = {};
  
  dataPoints.forEach(dp => {
    const stat = statistics.find(s => s.id === dp.statisticId);
    if (stat && stat.category) {
      if (!categoryData[stat.category]) {
        categoryData[stat.category] = [];
      }
      categoryData[stat.category].push(dp.value);
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

export async function getTopPerformers(statisticId: number, limit: number = 10, year: number = 2023): Promise<any[]> {
  const dataPoints = await getDataPointsForStatistic(statisticId, year);
  
  return dataPoints
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map(dp => ({
      state: dp.stateName,
      value: dp.value,
      rank: dataPoints.findIndex(p => p.stateName === dp.stateName) + 1
    }));
}

export async function getBottomPerformers(statisticId: number, limit: number = 10, year: number = 2023): Promise<any[]> {
  const dataPoints = await getDataPointsForStatistic(statisticId, year);
  
  return dataPoints
    .sort((a, b) => a.value - b.value)
    .slice(0, limit)
    .map(dp => ({
      state: dp.stateName,
      value: dp.value,
      rank: dataPoints.findIndex(p => p.stateName === dp.stateName) + 1
    }));
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