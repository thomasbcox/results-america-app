import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { getTestDb, clearTestData } from '@/lib/test-setup';

describe('/api/categories', () => {
  let db: any;

  beforeEach(async () => {
    db = getTestDb();
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('GET /api/categories', () => {
    it('should return all categories', async () => {
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
  });
}); 