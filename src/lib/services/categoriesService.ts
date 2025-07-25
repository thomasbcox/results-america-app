import { db } from '../db/index';
import { categories, statistics } from '../db/schema';
import { eq } from 'drizzle-orm';
import type { 
  ICategoriesService, 
  CategoryData, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from '../types/service-interfaces';

export class CategoriesService implements ICategoriesService {
  static async getAllCategories(): Promise<CategoryData[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  static async getCategoryById(id: number): Promise<CategoryData | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0] || null;
  }

  static async getCategoriesWithStatistics(): Promise<(CategoryData & { statisticCount: number })[]> {
    // First get all categories
    const allCategories = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
    })
      .from(categories)
      .orderBy(categories.sortOrder);

    // Then get statistics count for each category
    const categoriesWithStats = await Promise.all(
      allCategories.map(async (category) => {
        const stats = await db.select({ id: statistics.id })
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

  static async createCategory(data: CreateCategoryInput): Promise<CategoryData> {
    const [category] = await db.insert(categories).values(data).returning();
    return category;
  }

  static async updateCategory(id: number, data: UpdateCategoryInput): Promise<CategoryData> {
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return category;
  }

  static async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
} 