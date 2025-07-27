import { db } from '../db/index';
import { categories, statistics } from '../db/schema-normalized';
import { eq } from 'drizzle-orm';
import type { 
  ICategoriesService, 
  CategoryData, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from '../types/service-interfaces';

export class CategoriesService {
  static async getAllCategories(): Promise<CategoryData[]> {
    const result = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
    return result.map((category: any) => ({
      ...category,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesWithStatistics(): Promise<CategoryData[]> {
    const result = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      statisticCount: statistics.id,
    })
      .from(categories)
      .leftJoin(statistics, eq(categories.id, statistics.categoryId))
      .orderBy(categories.sortOrder, categories.name);

    // Group by category and count statistics
    const categoryMap = new Map();
    result.forEach((row: any) => {
      if (!categoryMap.has(row.id)) {
        categoryMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          icon: row.icon,
          sortOrder: row.sortOrder,
          isActive: row.isActive ?? 1,
          statisticCount: 0,
        });
      }
      if (row.statisticCount) {
        categoryMap.get(row.id).statisticCount++;
      }
    });

    return Array.from(categoryMap.values());
  }

  static async getCategoryById(id: number): Promise<CategoryData | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const category = result[0];
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async createCategory(data: CreateCategoryInput): Promise<CategoryData> {
    const [category] = await db.insert(categories).values(data).returning();
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async updateCategory(id: number, data: UpdateCategoryInput): Promise<CategoryData> {
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
} 