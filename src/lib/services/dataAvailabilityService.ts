import { getDb } from '../db/index';
import { statistics, dataPoints, categories, dataSources } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

// Check if a specific statistic has data points
export async function hasDataForStatistic(statisticId: number, database = getDb()) {
  const result = await database
    .select({ count: count() })
    .from(dataPoints)
    .where(eq(dataPoints.statisticId, statisticId));
  
  return result[0]?.count > 0;
}

// Get all statistics that have data
export async function getStatisticsWithData(database = getDb()) {
  const result = await database
    .select({ statisticId: dataPoints.statisticId })
    .from(dataPoints)
    .groupBy(dataPoints.statisticId);
  
  const statisticsWithData = result.map((r: any) => r.statisticId);
  
  // For demonstration purposes, let's simulate that some statistics don't have data
  // In a real scenario, this would be based on actual data availability
  // const statisticsWithoutData = [37, 38]; // Simulate some statistics as having no data
  
  return statisticsWithData; // Return all statistics for now
}

// Get categories that have statistics with data
export async function getCategoriesWithData(database = getDb()) {
  const statisticsWithData = await getStatisticsWithData(database);
  
  if (statisticsWithData.length === 0) return [];
  
  // Get all statistics with their categories
  const allStatistics = await database
    .select({
      id: statistics.id,
      categoryId: statistics.categoryId,
      categoryName: categories.name 
    })
    .from(statistics)
    .leftJoin(categories, eq(statistics.categoryId, categories.id));
  
  // Filter to only include statistics that have data
  const statisticsWithDataAndCategories = allStatistics.filter((stat: any) => 
    statisticsWithData.includes(stat.id)
  );
  
  // Get unique category names
  const categoryNames = [...new Set(
    statisticsWithDataAndCategories
      .map((stat: any) => stat.categoryName)
      .filter(Boolean)
  )];
  
  // For demonstration purposes, let's simulate that some categories don't have data
  // In a real scenario, this would be based on actual data availability
  // const categoriesWithoutData = ['Infrastructure']; // Simulate Infrastructure as having no data
  
  return categoryNames; // Return all categories for now
}

// Check if a category has any statistics with data
export async function hasDataForCategory(categoryName: string, database = getDb()) {
  const categoriesWithData = await getCategoriesWithData(database);
  return categoriesWithData.includes(categoryName);
}

// Get statistics for a category that have data
export async function getStatisticsForCategoryWithData(categoryName: string, database = getDb()) {
  const statisticsWithData = await getStatisticsWithData(database);
  
  if (statisticsWithData.length === 0) return [];
  
  const allStatistics = await database
    .select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      description: statistics.description,
      unit: statistics.unit,
      availableSince: statistics.availableSince,
      category: categories.name,
      source: dataSources.name,
      sourceUrl: dataSources.url,
    })
    .from(statistics)
    .leftJoin(categories, eq(statistics.categoryId, categories.id))
    .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
    .where(eq(categories.name, categoryName));
  
  // Filter to only include statistics that have data
  return allStatistics.filter((stat: any) => statisticsWithData.includes(stat.id));
} 