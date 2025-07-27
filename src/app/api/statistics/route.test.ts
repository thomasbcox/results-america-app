import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { setupTestDatabase, seedTestData, setupDatabaseMock, getTestDb } from '@/lib/test-setup';

// Mock the StatisticsService to use our test version
jest.mock('@/lib/services/statisticsService', () => {
  console.log('🔧 Setting up StatisticsService mock');
  class TestStatisticsService {
    static async getAllStatistics(useCache = false): Promise<any[]> {
      console.log('🔧 TestStatisticsService.getAllStatistics called');
      const { statistics, categories, dataSources } = require('@/lib/db/schema-normalized');
      const { eq } = require('drizzle-orm');
      const db = getTestDb();
      const result = await db.select({
        id: statistics.id,
        raNumber: statistics.raNumber,
        name: statistics.name,
        description: statistics.description,
        subMeasure: statistics.subMeasure,
        calculation: statistics.calculation,
        unit: statistics.unit,
        availableSince: statistics.availableSince,
        isActive: statistics.isActive,
        categoryId: statistics.categoryId,
        dataSourceId: statistics.dataSourceId,
        categoryName: categories.name,
        categoryDescription: categories.description,
        sourceName: dataSources.name,
        sourceDescription: dataSources.description,
        sourceUrl: dataSources.url,
      })
      .from(statistics)
      .leftJoin(categories, eq(statistics.categoryId, categories.id))
      .leftJoin(dataSources, eq(statistics.dataSourceId, dataSources.id))
      .orderBy(statistics.name);
      
      return result.map((stat: any) => ({
        ...stat,
        isActive: stat.isActive === 1 ? true : false,
        category: stat.categoryName ? {
          id: stat.categoryId,
          name: stat.categoryName,
          description: stat.categoryDescription,
        } : null,
        source: stat.sourceName ? {
          id: stat.dataSourceId,
          name: stat.sourceName,
          description: stat.sourceDescription,
          url: stat.sourceUrl,
        } : null,
      }));
    }

    static async getStatisticsWithPagination(options: any, filters: any = {}): Promise<any> {
      console.log('🔧 TestStatisticsService.getStatisticsWithPagination called with:', { options, filters });
      const allStatistics = await this.getAllStatistics();
      let filtered = allStatistics;
      
      if (filters.search) {
        filtered = allStatistics.filter(stat =>
          stat.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          stat.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
          stat.category?.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      if (filters.categoryId) {
        filtered = allStatistics.filter(stat => stat.categoryId === parseInt(filters.categoryId));
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
      console.log('🔧 TestStatisticsService.getStatisticsWithPagination returning:', result);
      return result;
    }

    static async searchStatistics(query: string): Promise<any[]> {
      console.log('🔧 TestStatisticsService.searchStatistics called with:', query);
      const allStatistics = await this.getAllStatistics();
      return allStatistics.filter(stat =>
        stat.name.toLowerCase().includes(query.toLowerCase()) ||
        stat.description?.toLowerCase().includes(query.toLowerCase()) ||
        stat.category?.name.toLowerCase().includes(query.toLowerCase())
      );
    }

    static async getStatisticsWithAvailability(): Promise<any[]> {
      console.log('🔧 TestStatisticsService.getStatisticsWithAvailability called');
      const allStatistics = await this.getAllStatistics();
      // Mock data availability for each statistic
      return allStatistics.map(stat => ({
        ...stat,
        dataAvailability: {
          hasData: Math.random() > 0.3, // 70% chance of having data
          lastUpdated: new Date().toISOString(),
          dataPoints: Math.floor(Math.random() * 100) + 1,
        },
      }));
    }

    static async getStatisticsByCategory(categoryId: number): Promise<any[]> {
      console.log('🔧 TestStatisticsService.getStatisticsByCategory called with:', categoryId);
      const allStatistics = await this.getAllStatistics();
      return allStatistics.filter(stat => stat.categoryId === categoryId);
    }
  }
  return { StatisticsService: TestStatisticsService };
});

describe('/api/statistics', () => {
  beforeEach(async () => {
    setupDatabaseMock();
    await setupTestDatabase();
    await seedTestData();
  });

  it('should have data in the database (direct service test)', async () => {
    const { StatisticsService } = require('@/lib/services/statisticsService');
    const statistics = await StatisticsService.getAllStatistics();
    console.log('🔍 Direct service test - statistics:', JSON.stringify(statistics, null, 2));
    expect(Array.isArray(statistics)).toBe(true);
    expect(statistics.length).toBeGreaterThan(0);
  });

  it('should call API route successfully', async () => {
    console.log('🔍 Testing basic API route call');
    const request = new NextRequest('http://localhost:3000/api/statistics');
    console.log('🔍 Created request');
    const response = await GET(request);
    console.log('🔍 Got response with status:', response.status);
    const data = await response.json();
    console.log('🔍 Response data:', JSON.stringify(data, null, 2));
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  describe('GET /api/statistics', () => {
    it('should return all statistics with sources without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('category');
      expect(data.data[0]).toHaveProperty('source');
    });

    it('should return statistics with proper source information', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check that statistics have source information
      const statsWithSources = data.data.filter((stat: any) => stat.source);
      expect(statsWithSources.length).toBeGreaterThan(0);
      
      // Check that statistics have category information
      const statsWithCategories = data.data.filter((stat: any) => stat.category);
      expect(statsWithCategories.length).toBeGreaterThan(0);
    });

    it('should return statistics with data availability when withAvailability=true', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?withAvailability=true');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('dataAvailability');
    });

    it('should return statistics without data availability when withAvailability=false', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?withAvailability=false');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).not.toHaveProperty('dataAvailability');
    });

    it('should filter statistics by category when categoryId is provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // All statistics should belong to the specified category
      const filteredStats = data.data.filter((stat: any) => stat.category?.id === 1);
      expect(filteredStats.length).toBe(data.data.length);
    });

    it('should support search functionality', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?search=education');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Should find education-related statistics (case-insensitive search)
      const foundStat = data.data.find((stat: any) => 
        stat.name.toLowerCase().includes('education') || 
        stat.description?.toLowerCase().includes('education') ||
        stat.category?.name.toLowerCase().includes('education')
      );
      expect(foundStat).toBeDefined();
    });

    it('should support pagination parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?page=1&limit=5');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeLessThanOrEqual(5);
    });

    it('should return only active statistics by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // All returned statistics should be active
      const activeStatistics = data.data.filter((stat: any) => stat.isActive === true);
      expect(activeStatistics.length).toBe(data.data.length);
    });

    it('should handle empty search results gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?search=nonexistentstatistic');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?page=-1&limit=0');
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
      const request = new NextRequest('http://localhost:3000/api/statistics', {
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
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('data');
      expect(data).toHaveProperty('pagination');
      
      if (data.pagination) {
        expect(data.pagination).toHaveProperty('page');
        expect(data.pagination).toHaveProperty('limit');
        expect(data.pagination).toHaveProperty('total');
        expect(data.pagination).toHaveProperty('totalPages');
      }
    });

    it('should include statistic metadata when available', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check that statistics have expected properties
      const statistic = data.data[0];
      expect(statistic).toHaveProperty('id');
      expect(statistic).toHaveProperty('name');
      expect(statistic).toHaveProperty('description');
      expect(statistic).toHaveProperty('unit');
      expect(statistic).toHaveProperty('categoryId');
      expect(statistic).toHaveProperty('isActive');
    });

    it('should handle withAvailability parameter correctly', async () => {
      // Test with explicit true
      const request1 = new NextRequest('http://localhost:3000/api/statistics?withAvailability=true');
      const response1 = await GET(request1);
      const data1 = await response1.json();

      expect(response1.status).toBe(200);
      expect(data1.success).toBe(true);
      expect(Array.isArray(data1.data)).toBe(true);
      expect(data1.data[0]).toHaveProperty('dataAvailability');

      // Test with explicit false
      const request2 = new NextRequest('http://localhost:3000/api/statistics?withAvailability=false');
      const response2 = await GET(request2);
      const data2 = await response2.json();

      expect(response2.status).toBe(200);
      expect(data2.success).toBe(true);
      expect(Array.isArray(data2.data)).toBe(true);
      expect(data2.data[0]).not.toHaveProperty('dataAvailability');

      // Test without parameter (should default to false)
      const request3 = new NextRequest('http://localhost:3000/api/statistics');
      const response3 = await GET(request3);
      const data3 = await response3.json();

      expect(response3.status).toBe(200);
      expect(data3.success).toBe(true);
      expect(Array.isArray(data3.data)).toBe(true);
      expect(data3.data[0]).not.toHaveProperty('dataAvailability');
    });

    it('should handle invalid categoryId gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/statistics?categoryId=999999');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });
  });
}); 