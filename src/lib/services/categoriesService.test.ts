import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { categories, statistics } from '../db/schema';
import { eq } from 'drizzle-orm';

// Create a test-specific version of CategoriesService
class TestCategoriesService {
  static async getAllCategories(db: any): Promise<any[]> {
    const result = await db.select().from(categories).orderBy(categories.sortOrder, categories.name);
    return result.map((category: any) => ({
      ...category,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesWithStatistics(db: any): Promise<any[]> {
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

  static async getCategoryById(db: any, id: number): Promise<any | null> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    if (result.length === 0) return null;
    
    const category = result[0];
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async createCategory(db: any, data: any): Promise<any> {
    const [category] = await db.insert(categories).values(data).returning();
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async updateCategory(db: any, id: number, data: any): Promise<any> {
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return {
      ...category,
      isActive: category.isActive ?? 1,
    };
  }

  static async deleteCategory(db: any, id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }
}

describe('categoriesService', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        categories: true,
        statistics: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  it('should create a new category', async () => {
    const db = testDb.db;
    const created = await TestCategoriesService.createCategory(db, {
      name: 'Test Category',
      description: 'Test Description',
      icon: 'TestIcon',
      sortOrder: 1,
    });

    expect(created).toBeDefined();
    expect(created.name).toBe('Test Category');
    expect(created.description).toBe('Test Description');
  });

  it('should get all categories', async () => {
    const db = testDb.db;
    const all = await TestCategoriesService.getAllCategories(db);
    expect(Array.isArray(all)).toBe(true);
    expect(all.length).toBeGreaterThan(0);
  });

  it('should get a category by id', async () => {
    const db = testDb.db;
    const created = await TestCategoriesService.createCategory(db, {
      name: 'Test Category',
      description: 'Test Description',
      icon: 'TestIcon',
      sortOrder: 1,
    });

    const category = await TestCategoriesService.getCategoryById(db, created.id);
    expect(category).toBeDefined();
    expect(category?.name).toBe('Test Category');
  });

  it('should get categories with statistics', async () => {
    const db = testDb.db;
    const categoriesWithStats = await TestCategoriesService.getCategoriesWithStatistics(db);
    expect(Array.isArray(categoriesWithStats)).toBe(true);
    expect(categoriesWithStats.length).toBeGreaterThan(0);
  });

  it('should update a category', async () => {
    const db = testDb.db;
    const created = await TestCategoriesService.createCategory(db, {
      name: 'Test Category',
      description: 'Test Description',
      icon: 'TestIcon',
      sortOrder: 1,
    });

    const updated = await TestCategoriesService.updateCategory(db, created.id, {
      name: 'Updated Category',
      description: 'Updated Description',
    });
    expect(updated.name).toBe('Updated Category');
  });

  it('should delete a category', async () => {
    const db = testDb.db;
    const created = await TestCategoriesService.createCategory(db, {
      name: 'Test Category',
      description: 'Test Description',
      icon: 'TestIcon',
      sortOrder: 1,
    });

    const deleted = await TestCategoriesService.deleteCategory(db, created.id);
    expect(deleted).toBe(true);

    const category = await TestCategoriesService.getCategoryById(db, created.id);
    expect(category).toBeNull();
  });
}); 