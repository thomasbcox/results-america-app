import { getDbOrThrow } from '../db/index';
import { categories, statistics, dataPoints, states } from '../db/schema-postgres';
import { eq, like, desc, asc, count, sql, and } from 'drizzle-orm';
import type { 
  ICategoriesService, 
  CategoryData, 
  CreateCategoryInput, 
  UpdateCategoryInput 
} from '../types/service-interfaces';
// Removed unused CategoryWithJoins import

export class CategoriesService {
  static async getAllCategories(): Promise<CategoryData[]> {
    const db = getDbOrThrow();
    const result = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
    }).from(categories).orderBy(categories.sortOrder, categories.name);
    
    return result.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesWithStatistics(): Promise<CategoryData[]> {
    const db = getDbOrThrow();
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
    const db = getDbOrThrow();
    const result = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
    }).from(categories).where(eq(categories.id, id)).limit(1);
    
    if (result.length === 0) return null;
    
    const category = result[0];
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive ?? 1,
    };
  }

  static async createCategory(data: CreateCategoryInput): Promise<CategoryData> {
    const db = getDbOrThrow();
    const [category] = await db.insert(categories).values(data).returning();
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive ?? 1,
    };
  }

  static async updateCategory(id: number, data: UpdateCategoryInput): Promise<CategoryData> {
    const db = getDbOrThrow();
    const [category] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
    if (!category) {
      throw new Error(`Category with id ${id} not found`);
    }
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive ?? 1,
    };
  }

  static async deleteCategory(id: number): Promise<boolean> {
    const db = getDbOrThrow();
    const result = await db.delete(categories).where(eq(categories.id, id)).returning();
    return result.length > 0;
  }

  static async searchCategories(searchTerm: string): Promise<CategoryData[]> {
    const db = getDbOrThrow();
    const result = await db
      .select({
        id: categories.id,
        name: categories.name,
        description: categories.description,
        icon: categories.icon,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
      })
      .from(categories)
      .where(like(categories.name, `%${searchTerm}%`))
      .orderBy(categories.sortOrder, categories.name);

    return result.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder ?? 0,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesWithPagination(
    pagination: { page: number; limit: number },
    sorting?: { sortBy?: string; sortOrder?: 'asc' | 'desc' }
  ): Promise<{ data: CategoryData[]; pagination: any }> {
    const db = getDbOrThrow();
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;
    
    // Build query with explicit sorting options (avoid reassign type widening)
    const baseQuery = db.select().from(categories);

    const orderedQuery = (() => {
      if (!sorting?.sortBy) {
        return baseQuery.orderBy(categories.sortOrder, categories.name);
      }
      switch (sorting.sortBy) {
        case 'name':
          return baseQuery.orderBy(sorting.sortOrder === 'desc' ? desc(categories.name) : asc(categories.name));
        case 'description':
          return baseQuery.orderBy(sorting.sortOrder === 'desc' ? desc(categories.description) : asc(categories.description));
        case 'sortOrder':
          return baseQuery.orderBy(sorting.sortOrder === 'desc' ? desc(categories.sortOrder) : asc(categories.sortOrder));
        case 'id':
          return baseQuery.orderBy(sorting.sortOrder === 'desc' ? desc(categories.id) : asc(categories.id));
        default:
          return baseQuery.orderBy(categories.sortOrder, categories.name);
      }
    })();

    // Apply pagination
    const pagedQuery = orderedQuery.limit(limit).offset(offset);

    const result = await pagedQuery;
    
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

  // NEW: Critical missing analytics methods for immediate business value

  static async getCategoryStatistics(categoryId: number): Promise<{
    category: CategoryData;
    statistics: {
      totalStatistics: number;
      activeStatistics: number;
      statisticsWithData: number;
      totalDataPoints: number;
      averageDataPointsPerStatistic: number;
      yearsWithData: number[];
      statesWithData: number;
    };
  }> {
    const db = getDbOrThrow();
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      throw new Error(`Category with id ${categoryId} not found`);
    }

    // Get statistics in this category
    const categoryStatistics = await db.select({
      id: statistics.id,
      isActive: statistics.isActive,
    })
      .from(statistics)
      .where(eq(statistics.categoryId, categoryId));

    // Get data points for statistics in this category
    const dataPointsResult = await db.select({
      statisticId: dataPoints.statisticId,
      year: dataPoints.year,
      stateId: dataPoints.stateId,
    })
      .from(dataPoints)
      .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(eq(statistics.categoryId, categoryId));

    const totalStatistics = categoryStatistics.length;
    const activeStatistics = categoryStatistics.filter((s: any) => s.isActive).length;
    const statisticsWithData = new Set(dataPointsResult.map((dp: any) => dp.statisticId)).size;
    const totalDataPoints = dataPointsResult.length;
    const averageDataPointsPerStatistic = totalStatistics > 0 ? totalDataPoints / totalStatistics : 0;
    const yearsWithData = [...new Set(dataPointsResult.map((dp: any) => dp.year as number))].sort() as number[];
    const statesWithData = new Set(dataPointsResult.map((dp: any) => dp.stateId)).size;

    return {
      category,
      statistics: {
        totalStatistics,
        activeStatistics,
        statisticsWithData,
        totalDataPoints,
        averageDataPointsPerStatistic: Math.round(averageDataPointsPerStatistic * 100) / 100,
        yearsWithData,
        statesWithData,
      },
    };
  }

  static async getCategoryDataCompleteness(categoryId: number): Promise<{
    category: CategoryData;
    completeness: {
      totalStatistics: number;
      statisticsWithData: number;
      coveragePercentage: number;
      averageDataPointsPerStatistic: number;
      dataQuality: 'complete' | 'partial' | 'minimal';
      yearsWithData: number[];
      statesWithData: number;
    };
  }> {
    const db = getDbOrThrow();
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      throw new Error(`Category with id ${categoryId} not found`);
    }

    // Get statistics in this category
    const categoryStatistics = await db.select({
      id: statistics.id,
    })
      .from(statistics)
      .where(eq(statistics.categoryId, categoryId));

    // Get data points for statistics in this category
    const dataPointsResult = await db.select({
      statisticId: dataPoints.statisticId,
      year: dataPoints.year,
      stateId: dataPoints.stateId,
    })
      .from(dataPoints)
      .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(eq(statistics.categoryId, categoryId));

    const totalStatistics = categoryStatistics.length;
    const statisticsWithData = new Set(dataPointsResult.map((dp: any) => dp.statisticId)).size;
    const coveragePercentage = totalStatistics > 0 ? (statisticsWithData / totalStatistics) * 100 : 0;
    const averageDataPointsPerStatistic = totalStatistics > 0 ? dataPointsResult.length / totalStatistics : 0;
    const yearsWithData = [...new Set(dataPointsResult.map((dp: any) => dp.year as number))].sort() as number[];
    const statesWithData = new Set(dataPointsResult.map((dp: any) => dp.stateId)).size;

    let dataQuality: 'complete' | 'partial' | 'minimal';
    if (coveragePercentage >= 90) {
      dataQuality = 'complete';
    } else if (coveragePercentage >= 50) {
      dataQuality = 'partial';
    } else {
      dataQuality = 'minimal';
    }

    return {
      category,
      completeness: {
        totalStatistics,
        statisticsWithData,
        coveragePercentage: Math.round(coveragePercentage * 100) / 100,
        averageDataPointsPerStatistic: Math.round(averageDataPointsPerStatistic * 100) / 100,
        dataQuality,
        yearsWithData,
        statesWithData,
      },
    };
  }

  static async getCategoryTrends(categoryId: number, years: number[]): Promise<{
    category: CategoryData;
    trends: Array<{
      year: number;
      statisticsWithData: number;
      totalDataPoints: number;
      averageDataPointsPerStatistic: number;
      statesWithData: number;
    }>;
  }> {
    const db = getDbOrThrow();
    const category = await this.getCategoryById(categoryId);
    if (!category) {
      throw new Error(`Category with id ${categoryId} not found`);
    }

    const trends = await db.select({
      year: dataPoints.year,
      statisticsWithData: sql<number>`COUNT(DISTINCT ${dataPoints.statisticId})`,
      totalDataPoints: count(),
      statesWithData: sql<number>`COUNT(DISTINCT ${dataPoints.stateId})`,
    })
      .from(dataPoints)
      .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .where(and(eq(statistics.categoryId, categoryId), sql`${dataPoints.year} = ANY(${years})`))
      .groupBy(dataPoints.year)
      .orderBy(dataPoints.year);

    return {
      category,
      trends: trends.map((trend: any) => ({
        year: trend.year,
        statisticsWithData: trend.statisticsWithData || 0,
        totalDataPoints: trend.totalDataPoints,
        averageDataPointsPerStatistic: trend.statisticsWithData > 0 ? 
          trend.totalDataPoints / trend.statisticsWithData : 0,
        statesWithData: trend.statesWithData || 0,
      })),
    };
  }

  static async getCategoryComparison(categoryIds: number[], year: number): Promise<{
    categories: CategoryData[];
    comparison: Array<{
      categoryId: number;
      categoryName: string;
      statisticsCount: number;
      dataPointsCount: number;
      statesWithData: number;
      averageDataPointsPerStatistic: number;
    }>;
  }> {
    const db = getDbOrThrow();
    const categories = await Promise.all(categoryIds.map(id => this.getCategoryById(id)));
    const validCategories = categories.filter(cat => cat !== null) as CategoryData[];

    const comparison = await Promise.all(
      categoryIds.map(async (categoryId) => {
        const category = validCategories.find(cat => cat.id === categoryId);
        if (!category) return null;

        // Get statistics count
        const statisticsCount = await db.select({ count: count() })
          .from(statistics)
          .where(eq(statistics.categoryId, categoryId));

        // Get data points for this category in the specified year
        const dataPointsResult = await db.select({
          statisticId: dataPoints.statisticId,
          stateId: dataPoints.stateId,
        })
          .from(dataPoints)
          .innerJoin(statistics, eq(dataPoints.statisticId, statistics.id))
          .where(and(eq(statistics.categoryId, categoryId), eq(dataPoints.year, year)));

        const dataPointsCount = dataPointsResult.length;
        const statesWithData = new Set(dataPointsResult.map((dp: any) => dp.stateId)).size;
        const averageDataPointsPerStatistic = statisticsCount[0]?.count > 0 ? 
          dataPointsCount / statisticsCount[0].count : 0;

        return {
          categoryId,
          categoryName: category.name,
          statisticsCount: statisticsCount[0]?.count || 0,
          dataPointsCount,
          statesWithData,
          averageDataPointsPerStatistic: Math.round(averageDataPointsPerStatistic * 100) / 100,
        };
      })
    );

    return {
      categories: validCategories,
      comparison: comparison.filter(item => item !== null) as any[],
    };
  }

  static async getCategoriesByDataAvailability(): Promise<CategoryData[]> {
    const db = getDbOrThrow();
    const result = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
      isActive: categories.isActive,
      statisticsWithData: sql<number>`COUNT(DISTINCT ${dataPoints.statisticId})`,
    })
      .from(categories)
      .leftJoin(statistics, eq(categories.id, statistics.categoryId))
      .leftJoin(dataPoints, eq(statistics.id, dataPoints.statisticId))
      .groupBy(categories.id)
      .orderBy(desc(sql`COUNT(DISTINCT ${dataPoints.statisticId})`));

    return result.map((category: any) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder,
      isActive: category.isActive ?? 1,
    }));
  }

  static async getCategoriesByDataQuality(quality: 'mock' | 'real'): Promise<CategoryData[]> {
    // For now, return all categories since we don't have real data quality tracking
    // This method provides the interface for future implementation
    const allCategories = await this.getAllCategories();
    return allCategories; // Placeholder implementation
  }
} 