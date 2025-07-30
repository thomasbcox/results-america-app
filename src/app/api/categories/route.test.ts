import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { setupTestDatabase, seedTestData, setupDatabaseMock, getTestDb } from '@/lib/test-setup';

// Mock the CategoriesService to use our test version
jest.mock('@/lib/services/categoriesService', () => {
  console.log('🔧 Setting up CategoriesService mock');
  class TestCategoriesService {
    static async getAllCategories(useCache = false): Promise<any[]> {
      console.log('🔧 TestCategoriesService.getAllCategories called');
      const { categories } = require('@/lib/db/schema-normalized');
      const db = getTestDb();
      const result = await db.select().from(categories).orderBy(categories.sortOrder);
      return result.map((category: any) => ({
        ...category,
        isActive: category.isActive === 1 ? true : false,
      }));
    }

    static async getCategoriesWithPagination(options: any, filters: any = {}): Promise<any> {
      console.log('🔧 TestCategoriesService.getCategoriesWithPagination called with:', { options, filters });
      const allCategories = await this.getAllCategories();
      let filtered = allCategories;
      
      if (filters.search) {
        filtered = allCategories.filter(category =>
          category.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          category.description?.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.sortBy) {
        filtered.sort((a, b) => {
          const aVal = a[filters.sortBy];
          const bVal = b[filters.sortBy];
          if (filters.sortOrder === 'desc') {
            return bVal.localeCompare(aVal);
          }
          return aVal.localeCompare(bVal);
        });
      }
      
      const { page = 1, limit = 10 } = options;
      const start = (page - 1) * limit;
      const end = start + limit;
      const paginated = filtered.slice(start, end);
      
      const result = {
        data: paginated,
        pagination: {
          page,
          limit,
          total: filtered.length,
          hasNext: end < filtered.length,
          hasPrev: page > 1
        }
      };
      console.log('🔧 TestCategoriesService.getCategoriesWithPagination returning:', result);
      return result;
    }

    static async searchCategories(query: string): Promise<any[]> {
      console.log('🔧 TestCategoriesService.searchCategories called with:', query);
      const allCategories = await this.getAllCategories();
      return allCategories.filter(category =>
        category.name.toLowerCase().includes(query.toLowerCase()) ||
        category.description?.toLowerCase().includes(query.toLowerCase())
      );
    }

    static async getCategoriesWithStats(): Promise<any[]> {
      console.log('🔧 TestCategoriesService.getCategoriesWithStats called');
      const allCategories = await this.getAllCategories();
      // Mock statistic count for each category
      return allCategories.map(category => ({
        ...category,
        statisticCount: Math.floor(Math.random() * 10) + 1, // Random count 1-10
      }));
    }

    static async getCategoriesWithStatistics(): Promise<any[]> {
      console.log('🔧 TestCategoriesService.getCategoriesWithStatistics called');
      const allCategories = await this.getAllCategories();
      // Mock statistic count for each category
      return allCategories.map(category => ({
        ...category,
        statisticCount: Math.floor(Math.random() * 10) + 1, // Random count 1-10
      }));
    }
  }
  return { CategoriesService: TestCategoriesService };
});

describe('/api/categories', () => {
  beforeEach(async () => {
    setupDatabaseMock();
    await setupTestDatabase();
    await seedTestData();
  });

  it('should have data in the database (direct service test)', async () => {
    const { CategoriesService } = require('@/lib/services/categoriesService');
    const categories = await CategoriesService.getAllCategories();
    console.log('🔍 Direct service test - categories:', JSON.stringify(categories, null, 2));
    expect(Array.isArray(categories)).toBe(true);
    expect(categories.length).toBeGreaterThan(0);
  });

  it('should call API route successfully', async () => {
    console.log('🔍 Testing basic API route call');
    const request = new NextRequest('http://localhost:3000/api/categories');
    console.log('🔍 Created request');
    const response = await GET(request);
    console.log('🔍 Got response with status:', response.status);
    const data = await response.json();
    console.log('🔍 Response data:', JSON.stringify(data, null, 2));
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  describe('GET /api/categories', () => {
    it('should return all categories without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('description');
    });

    it('should return categories with statistics when withStats=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories?withStats=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('statisticCount');
    });

    it('should return categories without statistics when withStats=false', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories?withStats=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).not.toHaveProperty('statisticCount');
    });

    it('should return categories in correct sort order', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check that categories are sorted by sortOrder
      const sortOrders = data.data.map((c: any) => c.sortOrder);
      const sortedOrders = [...sortOrders].sort((a, b) => a - b);
      expect(sortOrders).toEqual(sortedOrders);
    });

    it('should return only active categories by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // All returned categories should be active
      const activeCategories = data.data.filter((c: any) => c.isActive === true);
      expect(activeCategories.length).toBe(data.data.length);
    });

    it('should support search functionality', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories?search=education');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Should find education-related categories (case-insensitive search)
      const foundCategory = data.data.find((c: any) => 
        c.name.toLowerCase().includes('education') || 
        c.description?.toLowerCase().includes('education')
      );
      expect(foundCategory).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories?page=1&limit=3');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(3);
    });

    it('should handle empty search results gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories?search=nonexistentcategory');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories?page=-1&limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      // Should use default pagination values
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should work with authenticated users (no change in behavior)', async () => {
      // Simulate authenticated request (though this API doesn't require auth)
      const request = new NextRequest('http://localhost:3000/api/categories', {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should maintain consistent response structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      // Pagination is optional and only present when pagination is actually used
      if (data.pagination) {
        expect(data.pagination).toHaveProperty('page');
        expect(data.pagination).toHaveProperty('limit');
        expect(data.pagination).toHaveProperty('total');
        expect(data.pagination).toHaveProperty('totalPages');
      }
    });

    it('should include category metadata when available', async () => {
      const request = new NextRequest('http://localhost:3000/api/categories');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check that categories have expected properties
      const category = data.data[0];
      expect(category).toHaveProperty('id');
      expect(category).toHaveProperty('name');
      expect(category).toHaveProperty('description');
      expect(category).toHaveProperty('icon');
      expect(category).toHaveProperty('sortOrder');
      expect(category).toHaveProperty('isActive');
    });

    it('should handle withStats parameter correctly', async () => {
      // Test with explicit true
      const request1 = new NextRequest('http://localhost:3000/api/categories?withStats=true');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(Array.isArray(data1.data)).toBe(true);
      expect(data1.data[0]).toHaveProperty('statisticCount');

      // Test with explicit false
      const request2 = new NextRequest('http://localhost:3000/api/categories?withStats=false');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);
      expect(Array.isArray(data2.data)).toBe(true);
      expect(data2.data[0]).not.toHaveProperty('statisticCount');

      // Test without parameter (should default to false)
      const request3 = new NextRequest('http://localhost:3000/api/categories');
      const response3 = await GET(request3);
      const data3 = await response3.json();

      expect(response3.status).toBe(200);
      expect(data3.success).toBe(true);
      expect(Array.isArray(data3.data)).toBe(true);
      expect(data3.data[0]).not.toHaveProperty('statisticCount');
    });
  });
}); 