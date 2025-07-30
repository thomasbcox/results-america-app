import { getDb } from '../db/index';
import { categories, statistics } from '../db/schema-postgres';
import { eq, like, desc, asc } from 'drizzle-orm';
import type { 
  ICategoriesService, 
  CategoryData, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from '../types/service-interfaces';

export class CategoriesService {
  static async getAllCategories(): Promise<CategoryData[]> {
    const db = getDb();
    const result = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
    return result.map((category: any) => ({
      ...category,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesWithStatistics(): Promise<CategoryData[]> {
    const db = getDb();
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
    const db = getDb();
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const category = result[0];
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async createCategory(data: CreateCategoryInput): Promise<CategoryData> {
    const db = getDb();
    const [category] = await db.insert(categories).values(data).returning();
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async updateCategory(id: number, data: UpdateCategoryInput): Promise<CategoryData> {
    const db = getDb();
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
    const db = getDb();
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  static async searchCategories(searchTerm: string): Promise<CategoryData[]> {
    const db = getDb();
    const result = await db.select()
      .from(categories)
      .where(like(categories.name, `%${searchTerm}%`))
      .orderBy(categories.sortOrder, categories.name);
    
    return result.map((category: any) => ({
      ...category,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesWithPagination(
    pagination: { page: number; limit: number },
    sorting?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ data: CategoryData[]; pagination: any }> {
    const db = getDb();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    // Build query with explicit sorting options
    let query = db.select().from(categories);
    
    // Apply sorting based on valid fields
    if (sorting?.sortBy) {
      switch (sorting.sortBy) {
        case 'name':
          query = query.orderBy(sorting.sortOrder === 'desc' ? desc(categories.name) : asc(categories.name));
          break;
        case 'description':
          query = query.orderBy(sorting.sortOrder === 'desc' ? desc(categories.description) : asc(categories.description));
          break;
        case 'sortOrder':
          query = query.orderBy(sorting.sortOrder === 'desc' ? desc(categories.sortOrder) : asc(categories.sortOrder));
          break;
        case 'id':
          query = query.orderBy(sorting.sortOrder === 'desc' ? desc(categories.id) : asc(categories.id));
          break;
        default:
          // Default sorting
          query = query.orderBy(categories.sortOrder, categories.name);
      }
    } else {
      query = query.orderBy(categories.sortOrder, categories.name);
    }
    
    // Apply pagination
    query = query.limit(limit).offset(offset);
    
    const result = await query;
    
    // Get total count for pagination
    const totalResult = await db.select({ count: categories.id }).from(categories);
    const total = totalResult.length;
    
    const data = result.map((category: any) => ({
      ...category,
      isActive: category.isActive ?? 1,
    }));
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      }
    };
  }
} 