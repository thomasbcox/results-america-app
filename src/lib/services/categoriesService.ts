import { db } from '../db/index';
import { categories, statistics } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

export async function getAllCategories(database = db) {
  return database.select().from(categories).orderBy(categories.sortOrder);
}

export async function getCategoryById(id: number, database = db) {
  const result = await database.select().from(categories).where(eq(categories.id, id)).limit(1);
  return result[0] || null;
}

export async function getCategoriesWithStatistics(database = db) {
  return database.select({
    id: categories.id,
    name: categories.name,
    description: categories.description,
    icon: categories.icon,
    sortOrder: categories.sortOrder,
    statisticCount: statistics.id,
  })
    .from(categories)
    .leftJoin(statistics, eq(categories.id, statistics.categoryId))
    .orderBy(categories.sortOrder);
}

export async function createCategory(data: { name: string; description?: string; icon?: string; sortOrder?: number }, database = db) {
  return database.insert(categories).values(data).returning();
}

export async function updateCategory(id: number, data: Partial<{ name: string; description: string; icon: string; sortOrder: number; isActive: number }>, database = db) {
  return database.update(categories).set(data).where(eq(categories.id, id)).returning();
}

export async function deleteCategory(id: number, database = db) {
  return database.delete(categories).where(eq(categories.id, id)).returning();
} 