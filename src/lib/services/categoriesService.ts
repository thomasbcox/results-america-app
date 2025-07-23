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
  // First get all categories
  const allCategories = await database.select({
    id: categories.id,
    name: categories.name,
    description: categories.description,
    icon: categories.icon,
    sortOrder: categories.sortOrder,
  })
    .from(categories)
    .orderBy(categories.sortOrder);

  // Then get statistics count for each category
  const categoriesWithStats = await Promise.all(
    allCategories.map(async (category) => {
      const stats = await database.select({ id: statistics.id })
        .from(statistics)
        .where(eq(statistics.categoryId, category.id));
      
      return {
        ...category,
        statisticCount: stats.length
      };
    })
  );

  return categoriesWithStats;
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