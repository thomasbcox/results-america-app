import { db } from '../db/index';
import { statistics, dataSources, categories } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function getAllStatisticsWithSources(database = db) {
  return database.select({
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
    .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
    .leftJoin(categories, eq(statistics.categoryId, categories.id));
}

export async function getStatisticById(id: number, database = db) {
  const result = await database.select().from(statistics).where(eq(statistics.id, id)).limit(1);
  return result[0] || null;
}

// Database operation types that match the schema
interface CreateStatisticData {
  name: string;
  raNumber?: string;
  categoryId: number;
  dataSourceId?: number;
  description?: string;
  subMeasure?: string;
  calculation?: string;
  unit: string;
  availableSince?: string;
}

interface UpdateStatisticData {
  name?: string;
  raNumber?: string;
  categoryId?: number;
  dataSourceId?: number;
  description?: string;
  subMeasure?: string;
  calculation?: string;
  unit?: string;
  availableSince?: string;
}

export async function createStatistic(data: CreateStatisticData, database = db) {
  return database.insert(statistics).values(data).returning();
}

export async function updateStatistic(id: number, data: UpdateStatisticData, database = db) {
  return database.update(statistics).set(data).where(eq(statistics.id, id)).returning();
}

export async function deleteStatistic(id: number, database = db) {
  return database.delete(statistics).where(eq(statistics.id, id)).returning();
} 