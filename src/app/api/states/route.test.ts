import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET } from './route';
import { getTestDb, clearTestData } from '@/lib/test-setup';

describe('/api/states', () => {
  let db: any;

  beforeEach(async () => {
    db = getTestDb();
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  describe('GET /api/states', () => {
    it('should return all states', async () => {
      const request = new NextRequest('http://localhost:3000/api/states');
      const response = await GET(request);
      const data = await response.json();

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
  });
}); 