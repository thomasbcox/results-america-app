import { categories, dataSources, states, statistics, dataPoints, importSessions } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function createDataSource(db: BetterSQLite3Database, overrides = {}) {
  const [src] = await db.insert(dataSources).values({
    name: 'TestSource',
    url: 'https://test.com',
    ...overrides,
  }).returning();
  return src;
}

export async function createCategory(db: BetterSQLite3Database, overrides = {}) {
  const [cat] = await db.insert(categories).values({
    name: 'TestCat',
    icon: 'TestIcon',
    ...overrides,
  }).returning();
  return cat;
}

export async function createState(db: BetterSQLite3Database, overrides = {}) {
  const [st] = await db.insert(states).values({
    name: 'Testland',
    abbreviation: 'TL',
    ...overrides,
  }).returning();
  return st;
}

export async function createImportSession(db: BetterSQLite3Database, overrides = {}) {
  const [session] = await db.insert(importSessions).values({
    name: 'Test Import Session',
    dataYear: 2023,
    recordCount: 100,
    isActive: 1,
    ...overrides,
  }).returning();
  return session;
}

export async function createStatistic(db: BetterSQLite3Database, { categoryId, dataSourceId, ...overrides }: { categoryId: number; dataSourceId: number; [key: string]: unknown }) {
  const [stat] = await db.insert(statistics).values({
    name: 'Test Stat',
    raNumber: '9999',
    categoryId,
    dataSourceId,
    unit: 'TestUnit',
    ...overrides,
  }).returning();
  return stat;
}

export async function createDataPoint(db: BetterSQLite3Database, { importSessionId, stateId, statisticId, ...overrides }: { importSessionId: number; stateId: number; statisticId: number; [key: string]: unknown }) {
  const [dp] = await db.insert(dataPoints).values({
    year: 2023,
    value: 100.0,
    importSessionId,
    stateId,
    statisticId,
    ...overrides,
  }).returning();
  return dp;
}

export async function clearAllTestData(db: BetterSQLite3Database) {
  // Delete in FK-safe order
  await db.delete(dataPoints);
  await db.delete(statistics);
  await db.delete(states);
  await db.delete(categories);
  await db.delete(dataSources);
  await db.delete(importSessions);
} 