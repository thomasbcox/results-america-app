import { categories, dataSources, states, statistics } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function createDataSource(db, overrides = {}) {
  const [src] = await db.insert(dataSources).values({
    name: 'TestSource',
    url: 'https://test.com',
    ...overrides,
  }).returning();
  return src;
}

export async function createCategory(db, overrides = {}) {
  const [cat] = await db.insert(categories).values({
    name: 'TestCat',
    icon: 'TestIcon',
    ...overrides,
  }).returning();
  return cat;
}

export async function createState(db, overrides = {}) {
  const [st] = await db.insert(states).values({
    name: 'Testland',
    abbreviation: 'TL',
    ...overrides,
  }).returning();
  return st;
}

export async function createStatistic(db, { categoryId, dataSourceId, ...overrides }) {
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

export async function clearAllTestData(db) {
  // Delete in FK-safe order
  await db.delete(statistics);
  await db.delete(states);
  await db.delete(categories);
  await db.delete(dataSources);
} 