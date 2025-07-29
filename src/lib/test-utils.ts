// Simple Test Factory Functions
// Following the ideal pattern from the programming guide - no complex builders

import { getDb } from './db';
import { 
  states,
  categories,
  dataSources,
  statistics,
  importSessions,
  dataPoints
} from './db/schema';
import { eq } from 'drizzle-orm';
import type { 
  StateData, 
  CategoryData, 
  StatisticData, 
  DataPointData,
  CreateStateInput,
  CreateCategoryInput,
  CreateStatisticInput,
  CreateDataPointInput
} from './types/service-interfaces';

// ============================================================================
// STATE TEST FACTORIES
// ============================================================================

export const createTestStateData = (overrides: Partial<CreateStateInput> = {}): CreateStateInput => ({
  name: `Test State ${Date.now()}`,
  abbreviation: `TS${Math.random().toString(36).substr(2, 3).toUpperCase()}`,
  ...overrides
});

export const insertTestState = async (data: CreateStateInput): Promise<StateData> => {
  const db = getDb();
  const [state] = await db.insert(states).values(data).returning();
  return {
    ...state,
    isActive: state.isActive ?? 1,
  };
};

export const createTestState = async (overrides: Partial<CreateStateInput> = {}): Promise<StateData> => {
  const data = createTestStateData(overrides);
  return await insertTestState(data);
};

// ============================================================================
// CATEGORY TEST FACTORIES
// ============================================================================

export const createTestCategoryData = (overrides: Partial<CreateCategoryInput> = {}): CreateCategoryInput => ({
  name: `Test Category ${Date.now()}`,
  description: 'Test category description',
  icon: 'test-icon',
  sortOrder: 0,
  ...overrides
});

export const insertTestCategory = async (data: CreateCategoryInput): Promise<CategoryData> => {
  const db = getDb();
  const [category] = await db.insert(categories).values(data).returning();
  return {
    ...category,
    sortOrder: category.sortOrder ?? 0,
    isActive: category.isActive ?? 1,
  };
};

export const createTestCategory = async (overrides: Partial<CreateCategoryInput> = {}): Promise<CategoryData> => {
  const data = createTestCategoryData(overrides);
  return await insertTestCategory(data);
};

// ============================================================================
// DATA SOURCE TEST FACTORIES
// ============================================================================

export const createTestDataSourceData = (overrides: Partial<{ name: string; description?: string; url?: string }> = {}): { name: string; description?: string; url?: string } => ({
  name: `Test Data Source ${Date.now()}`,
  description: 'Test data source description',
  url: 'https://example.com',
  ...overrides
});

export const insertTestDataSource = async (data: { name: string; description?: string; url?: string }): Promise<any> => {
  const db = getDb();
  const [dataSource] = await db.insert(dataSources).values(data).returning();
  return dataSource;
};

export const createTestDataSource = async (overrides: Partial<{ name: string; description?: string; url?: string }> = {}): Promise<any> => {
  const data = createTestDataSourceData(overrides);
  return await insertTestDataSource(data);
};

// ============================================================================
// STATISTIC TEST FACTORIES
// ============================================================================

export const createTestStatisticData = (overrides: Partial<CreateStatisticInput> = {}): CreateStatisticInput => ({
  raNumber: `RA${Math.floor(Math.random() * 9000) + 1000}`,
  categoryId: 1, // Will be overridden in practice
  dataSourceId: 1, // Will be overridden in practice
  name: `Test Statistic ${Date.now()}`,
  description: 'Test statistic description',
  unit: 'test unit',
  dataQuality: 'mock',
  ...overrides
});

export const insertTestStatistic = async (data: CreateStatisticInput): Promise<StatisticData> => {
  const db = getDb();
  const [statistic] = await db.insert(statistics).values(data).returning();
  return {
    ...statistic,
    dataQuality: statistic.dataQuality ?? 'mock',
    isActive: statistic.isActive ?? 1,
  };
};

export const createTestStatistic = async (overrides: Partial<CreateStatisticInput> = {}): Promise<StatisticData> => {
  const data = createTestStatisticData(overrides);
  return await insertTestStatistic(data);
};

// ============================================================================
// DATA POINT TEST FACTORIES
// ============================================================================

export const createTestDataPointData = (overrides: Partial<CreateDataPointInput> = {}): CreateDataPointInput => ({
  statisticId: 1, // Will be overridden in practice
  stateId: 1, // Will be overridden in practice
  year: 2023,
  value: 75.5,
  importSessionId: 1, // Will be overridden in practice
  ...overrides
});

export const insertTestDataPoint = async (data: CreateDataPointInput): Promise<DataPointData> => {
  const db = getDb();
  const [dataPoint] = await db.insert(dataPoints).values(data).returning();
  return dataPoint;
};

export const createTestDataPoint = async (overrides: Partial<CreateDataPointInput> = {}): Promise<DataPointData> => {
  const data = createTestDataPointData(overrides);
  return await insertTestDataPoint(data);
};

// ============================================================================
// COMPOSITE TEST FACTORIES
// ============================================================================

export const createTestStateWithData = async (overrides: { 
  state?: Partial<CreateStateInput>; 
  category?: Partial<CreateCategoryInput>; 
  dataSource?: Partial<{ name: string; description?: string; url?: string }>; 
  statistic?: Partial<CreateStatisticInput>; 
  dataPoint?: Partial<CreateDataPointInput>; 
} = {}) => {
  const state = await createTestState(overrides.state || {});
  const category = await createTestCategory(overrides.category || {});
  const dataSource = await createTestDataSource(overrides.dataSource || {});
  const statistic = await createTestStatistic({ 
    categoryId: category.id,
    ...overrides.statistic 
  });
  const dataPoint = await createTestDataPoint({ 
    stateId: state.id,
    statisticId: statistic.id,
    importSessionId: 1, // You'll need to create an import session if needed
    ...overrides.dataPoint 
  });
  
  return { state, category, dataSource, statistic, dataPoint };
};

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

export const cleanup = async () => {
  const db = getDb();
  // Clean up in reverse dependency order
  await db.delete(dataPoints);
  await db.delete(importSessions);
  await db.delete(statistics);
  await db.delete(dataSources);
  await db.delete(categories);
  await db.delete(states);
};

export const cleanupData = async () => {
  const db = getDb();
  // Clean up only data, keep foundation data
  await db.delete(dataPoints);
  await db.delete(importSessions);
  await db.delete(statistics);
  await db.delete(dataSources);
}; 