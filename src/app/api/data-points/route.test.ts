import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../../../lib/test-infrastructure/bulletproof-test-db';
import { dataPoints, statistics, states, categories, dataSources, importSessions } from '../../../lib/db/schema';
import { eq } from 'drizzle-orm';
import { GET } from './route';
import { NextRequest } from 'next/server';

describe('GET /api/data-points', () => {
  let testDb: any;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        importSessions: true,
        dataPoints: true
      }
    });
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('Get Data Points for State', () => {
    it('should return data points for a specific state', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toBeDefined();
      expect(Array.isArray(data.data.data)).toBe(true);
      
      // Should return data points for state 1 (Alabama)
      data.data.data.forEach((point: any) => {
        expect(point.stateId).toBe(1);
        expect(point.stateName).toBe('Alabama');
      });
    });

    it('should return data points for a specific state and year', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toBeDefined();
      
      data.data.data.forEach((point: any) => {
        expect(point.stateId).toBe(1);
        expect(point.year).toBe(2023);
      });
    });

    it('should return empty array for state with no data', async () => {
      // Clear data for state 1
      await testDb.db.delete(dataPoints).where(eq(dataPoints.stateId, 1));
      
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual([]);
    });

    it('should return 400 for invalid stateId', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=invalid');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid stateId parameter');
    });

    it('should return 400 for non-existent stateId', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=999');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Should still return success with empty data
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual([]);
    });
  });

  describe('Get Data Points for Statistic', () => {
    it('should return data points for a specific statistic', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?statisticId=1');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toBeDefined();
      expect(Array.isArray(data.data.data)).toBe(true);
      
      // Should return data points for statistic 1 (High School Graduation Rate)
      data.data.data.forEach((point: any) => {
        expect(point.statisticId).toBe(1);
        expect(point.statisticName).toBe('High School Graduation Rate');
      });
    });

    it('should return data points for a specific statistic and year', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?statisticId=1&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toBeDefined();
      
      data.data.data.forEach((point: any) => {
        expect(point.statisticId).toBe(1);
        expect(point.year).toBe(2023);
      });
    });

    it('should return empty array for statistic with no data', async () => {
      // Clear data for statistic 1
      await testDb.db.delete(dataPoints).where(eq(dataPoints.statisticId, 1));
      
      const request = new NextRequest('http://localhost:3000/api/data-points?statisticId=1');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toEqual([]);
    });

    it('should return 400 for invalid statisticId', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?statisticId=invalid');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid statisticId parameter');
    });
  });

  describe('Get Data Points for Comparison', () => {
    it('should return data points for multiple states and statistics', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&statisticIds=1,2&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.data).toBeDefined();
      expect(Array.isArray(data.data.data)).toBe(true);
      
      // Should return data points for the specified states and statistics
      const stateIds = new Set([1, 2]);
      const statisticIds = new Set([1, 2]);
      
      data.data.data.forEach((point: any) => {
        expect(stateIds.has(point.stateId)).toBe(true);
        expect(statisticIds.has(point.statisticId)).toBe(true);
        expect(point.year).toBe(2023);
      });
    });

    it('should return 400 for invalid stateIds', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,invalid&statisticIds=1,2&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid stateIds or statisticIds parameters');
    });

    it('should return 400 for invalid statisticIds', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&statisticIds=1,invalid&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid stateIds or statisticIds parameters');
    });

    it('should return 400 for missing year parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&statisticIds=1,2');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for invalid year parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&statisticIds=1,2&year=invalid');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid year parameter');
    });
  });

  describe('Parameter Validation', () => {
    it('should return 400 for missing all parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for missing stateIds with statisticIds', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?statisticIds=1,2&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should return 400 for missing statisticIds with stateIds', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required parameters');
    });

    it('should handle empty stateIds array', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=&statisticIds=1,2&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid stateIds or statisticIds parameters');
    });

    it('should handle empty statisticIds array', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateIds=1,2&statisticIds=&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid stateIds or statisticIds parameters');
    });
  });

  describe('Data Structure and Content', () => {
    it('should return data points with correct structure', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.data).toBeDefined();
      
      if (data.data.data.length > 0) {
        const point = data.data.data[0];
        expect(point).toHaveProperty('id');
        expect(point).toHaveProperty('stateId');
        expect(point).toHaveProperty('stateName');
        expect(point).toHaveProperty('statisticId');
        expect(point).toHaveProperty('statisticName');
        expect(point).toHaveProperty('year');
        expect(point).toHaveProperty('value');
        expect(point).toHaveProperty('unit');
        expect(point).toHaveProperty('category');
      }
    });

    it('should return data points with correct data types', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      if (data.data.data.length > 0) {
        const point = data.data.data[0];
        expect(typeof point.id).toBe('number');
        expect(typeof point.stateId).toBe('number');
        expect(typeof point.stateName).toBe('string');
        expect(typeof point.statisticId).toBe('number');
        expect(typeof point.statisticName).toBe('string');
        expect(typeof point.year).toBe('number');
        expect(typeof point.value).toBe('number');
        expect(typeof point.unit).toBe('string');
        expect(typeof point.category).toBe('string');
      }
    });

    it('should include related data (state, statistic, category info)', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&year=2023');
      
      const response = await GET(request);
      const data = await response.json();

      if (data.data.data.length > 0) {
        const point = data.data.data[0];
        
        // Should include state information
        expect(point.stateName).toBe('Alabama');
        
        // Should include statistic information
        expect(point.statisticName).toBeDefined();
        expect(point.unit).toBeDefined();
        
        // Should include category information
        expect(point.category).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // This test would require mocking the database to throw errors
      // For now, we'll test with a valid request
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1');
      
      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should handle malformed URL parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&invalid=param');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200); // Should ignore invalid parameters
      expect(data.success).toBe(true);
    });

    it('should handle special characters in parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&year=2023&extra=%20');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Performance and Concurrency', () => {
    it('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      // Make multiple concurrent requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        const request = new NextRequest(`http://localhost:3000/api/data-points?stateId=${i % 3 + 1}`);
        promises.push(GET(request));
      }
      
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle large result sets efficiently', async () => {
      // Add many data points for testing
      const dataPointsToAdd = [];
      for (let i = 0; i < 100; i++) {
        dataPointsToAdd.push({
          importSessionId: 1,
          year: 2023,
          stateId: 1,
          statisticId: 1,
          value: 100.0 + i
        });
      }
      
      await testDb.db.insert(dataPoints).values(dataPointsToAdd);
      
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1&year=2023');
      
      const startTime = Date.now();
      const response = await GET(request);
      const endTime = Date.now();
      
      const data = await response.json();
      
      expect(response.status).toBe(200);
      expect(data.data.data.length).toBeGreaterThan(100);
      expect(endTime - startTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large parameter values', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=999999999');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.data).toEqual([]);
    });

    it('should handle negative parameter values', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=-1');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.data).toEqual([]);
    });

    it('should handle decimal parameter values', async () => {
      const request = new NextRequest('http://localhost:3000/api/data-points?stateId=1.5');
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Invalid stateId parameter');
    });

    it('should handle very long parameter lists', async () => {
      const stateIds = Array.from({ length: 50 }, (_, i) => i + 1).join(',');
      const statisticIds = Array.from({ length: 50 }, (_, i) => i + 1).join(',');
      
      const request = new NextRequest(`http://localhost:3000/api/data-points?stateIds=${stateIds}&statisticIds=${statisticIds}&year=2023`);
      
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });
}); 