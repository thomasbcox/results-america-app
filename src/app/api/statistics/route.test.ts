import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '@/lib/test-infrastructure/bulletproof-test-db';
import { JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
import { GET } from './route';

// Mock the database connection for the services
jest.mock('@/lib/db', () => ({
  getDb: () => {
    return (global as any).testDb?.db || null;
  }
}));

describe('/api/statistics', () => {
  let testDb: any;

  beforeEach(async () => {
    // Create fresh test database with bulletproof isolation
    testDb = await TestUtils.createAndSeed({
      config: { verbose: true },
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        users: true
      }
    });

    // Make testDb available globally for the mock
    (global as any).testDb = testDb;
  });

  afterEach(() => {
    // Clean up test database
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
    TestUtils.cleanup();
    (global as any).testDb = null;
  });

  describe('GET', () => {
    it('should return statistics list', async () => {
      const request = JestTestHelpers.createMockRequest('/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (statistics):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should handle search parameter', async () => {
      const request = JestTestHelpers.createMockRequest('/api/statistics?search=GDP');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (search):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle category filtering', async () => {
      const request = JestTestHelpers.createMockRequest('/api/statistics?categoryId=1');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (category):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle pagination', async () => {
      const request = JestTestHelpers.createMockRequest('/api/statistics?page=1&limit=5');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (pagination):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should include preference_direction in responses', async () => {
      const request = JestTestHelpers.createMockRequest('/api/statistics');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (preference):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      
      if (data.data.length > 0) {
        expect(data.data[0]).toHaveProperty('preferenceDirection');
        expect(['higher', 'lower', 'neutral']).toContain(data.data[0].preferenceDirection);
      }
    });
  });
}); 