// Mock the StatesService to use our test version
jest.mock('@/lib/services/statesService', () => {
  console.log('🔧 Setting up StatesService mock');
  
  // Create a test-specific version of StatesService that uses the test database
  class TestStatesService {
    static async getAllStates(useCache = false): Promise<any[]> {
      console.log('🔧 TestStatesService.getAllStates called');
      const { getTestDb } = require('@/lib/test-setup');
      const { states } = require('@/lib/db/schema-normalized');
      const db = getTestDb();
      const result = await db.select().from(states).orderBy(states.name);
      return result.map((state: any) => ({
        ...state,
        isActive: state.isActive === 1 ? true : false,
      }));
    }

    static async getStatesWithPagination(options: any, filters: any = {}): Promise<any> {
      console.log('🔧 TestStatesService.getStatesWithPagination called with:', { options, filters });
      const allStates = await this.getAllStates();
      
      // Apply filters if provided
      let filtered = allStates;
      if (filters.search) {
        filtered = allStates.filter(state => 
          state.name.toLowerCase().includes(filters.search.toLowerCase()) ||
          state.abbreviation.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      
      // Apply sorting if provided
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
      
      // Apply pagination
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
      
      console.log('🔧 TestStatesService.getStatesWithPagination returning:', result);
      return result;
    }

    static async searchStates(query: string): Promise<any[]> {
      console.log('🔧 TestStatesService.searchStates called with:', query);
      const allStates = await this.getAllStates();
      return allStates.filter(state => 
        state.name.toLowerCase().includes(query.toLowerCase()) ||
        state.abbreviation.toLowerCase().includes(query.toLowerCase())
      );
    }

    static async getStateById(id: number): Promise<any | null> {
      const { getTestDb } = require('@/lib/test-setup');
      const { states } = require('@/lib/db/schema-normalized');
      const { eq } = require('drizzle-orm');
      const db = getTestDb();
      const result = await db.select().from(states).where(eq(states.id, id)).limit(1);
      if (result.length === 0) return null;
      
      const state = result[0];
      return {
        ...state,
        isActive: state.isActive === 1 ? true : false,
      };
    }
  }

  return {
    StatesService: TestStatesService,
  };
});

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { setupTestDatabase, seedTestData, getTestDb } from '@/lib/test-setup';
import { states } from '@/lib/db/schema-normalized';
import { eq } from 'drizzle-orm';

describe('/api/states', () => {
  beforeEach(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  // Test the service directly first
  it('should have data in the database (direct service test)', async () => {
    const { StatesService } = require('@/lib/services/statesService');
    const states = await StatesService.getAllStates();
    console.log('🔍 Direct service test - states:', JSON.stringify(states, null, 2));
    expect(Array.isArray(states)).toBe(true);
    expect(states.length).toBeGreaterThan(0);
  });

  // Test basic API route functionality
  it('should call API route successfully', async () => {
    console.log('🔍 Testing basic API route call');
    const request = new NextRequest('http://localhost:3000/api/states');
    console.log('🔍 Created request');
    const response = await GET(request);
    console.log('🔍 Got response with status:', response.status);
    const data = await response.json();
    console.log('🔍 Response data:', JSON.stringify(data, null, 2));
    
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  describe('GET /api/states', () => {
    it('should return all states without authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/states');
      const response = await GET(request);
      const data = await response.json();

      console.log('Response status:', response.status);
      console.log('Response data:', JSON.stringify(data, null, 2));

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data[0]).toHaveProperty('id');
      expect(data.data[0]).toHaveProperty('name');
      expect(data.data[0]).toHaveProperty('abbreviation');
    });

    it('should return states in alphabetical order', async () => {
      const request = new NextRequest('http://localhost:3000/api/states');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check that states are in alphabetical order
      const stateNames = data.data.map((s: any) => s.name);
      const sortedNames = [...stateNames].sort();
      expect(stateNames).toEqual(sortedNames);
    });

    it('should support pagination parameters', async () => {
      try {
        console.log('🔍 Starting pagination test');
        const request = new NextRequest('http://localhost:3000/api/states?page=2&limit=5');
        console.log('🔍 Created request with URL:', request.url);
        const response = await GET(request);
        console.log('🔍 Got response with status:', response.status);
        const data = await response.json();

        console.log('🔍 Pagination test - response data:', JSON.stringify(data, null, 2));
        console.log('🔍 data.data type:', typeof data.data);
        console.log('🔍 data.data isArray:', Array.isArray(data.data));

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
        expect(data.data.length).toBeLessThanOrEqual(5);
      } catch (error) {
        console.log('🔍 Error in pagination test:', error);
        throw error;
      }
    });

    it('should support search functionality', async () => {
      const request = new NextRequest('http://localhost:3000/api/states?search=california');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Should find California (case-insensitive search)
      const foundState = data.data.find((s: any) => 
        s.name.toLowerCase().includes('california')
      );
      expect(foundState).toBeDefined();
    });

    it('should support sorting parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/states?sortBy=abbreviation&sortOrder=desc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // Check that states are sorted by abbreviation in descending order
      const abbreviations = data.data.map((s: any) => s.abbreviation);
      const sortedAbbreviations = [...abbreviations].sort().reverse();
      expect(abbreviations).toEqual(sortedAbbreviations);
    });

    it('should return only active states by default', async () => {
      const request = new NextRequest('http://localhost:3000/api/states');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      // All returned states should be active
      const activeStates = data.data.filter((s: any) => s.isActive === true);
      expect(activeStates.length).toBe(data.data.length);
    });

    it('should handle empty search results gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/states?search=nonexistentstate');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(0);
    });

    it('should handle invalid pagination parameters gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/states?page=-1&limit=0');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      // Should use default pagination values
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should return proper error for invalid sort parameters', async () => {
      const request = new NextRequest('http://localhost:3000/api/states?sortBy=invalid&sortOrder=invalid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should work with authenticated users (no change in behavior)', async () => {
      // Simulate authenticated request (though this API doesn't require auth)
      const request = new NextRequest('http://localhost:3000/api/states', {
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
      const request = new NextRequest('http://localhost:3000/api/states');
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
  });
}); 