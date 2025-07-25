import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { getTestDb, clearTestData } from '@/lib/test-setup';

describe('/api/statistics', () => {
  let db: any;

  beforeEach(async () => {
    db = getTestDb();
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('GET /api/statistics', () => {
    it('should return all statistics with sources', async () => {
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
  });
}); 