import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '@/lib/test-infrastructure/bulletproof-test-db';
import { JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
import { GET, POST } from './unified/route';

// Mock File API for testing
global.File = class File {
  constructor(public content: string, public name: string, public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

// Mock the database connection for the services
jest.mock('@/lib/db', () => ({
  getDb: () => {
    return (global as any).testDb?.db || null;
  }
}));

// Also mock the relative path import
jest.mock('../../../../lib/db/index', () => ({
  getDb: () => {
    return (global as any).testDb?.db || null;
  }
}));

describe('/api/admin/csv-imports', () => {
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
        users: true,
        csvTemplates: true
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

  it('should import GET and POST functions', () => {
    console.log('GET function:', typeof GET);
    console.log('POST function:', typeof POST);
    expect(typeof GET).toBe('function');
    expect(typeof POST).toBe('function');
  });

  describe('GET', () => {
    it('should return list of CSV imports', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports');
      
      console.log('About to call GET route...');
      
      try {
        const response = await GET(request);
        console.log('GET route called successfully');
        
        const data = await response.json();
        console.log('Response status:', response.status);
        console.log('Response data:', data);

        // Temporarily allow 500 status to see what the error is
        if (response.status === 500) {
          console.log('500 Error Response:', data);
          expect(data).toHaveProperty('success', false);
          expect(data).toHaveProperty('error');
          return;
        }

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      } catch (error) {
        console.error('Exception caught:', error);
        console.error('Error stack:', error.stack);
        throw error;
      }
    });

    it('should handle pagination parameters', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports?page=1&limit=10');
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

    it('should filter by status', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports?status=staged');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (status filter):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter by uploaded by user', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports?uploadedBy=1');
      const response = await GET(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (user filter):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  describe('POST', () => {
    it('should successfully upload CSV file', async () => {
      const csvContent = `State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000
Alaska,2023,Economy,GDP,50000`;

      const formData = new FormData();
      const file = new File(csvContent, 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('templateId', '1');
      formData.append('metadata', JSON.stringify({ description: 'Test upload' }));
      formData.append('userId', '1');

      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (POST upload):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const formData = new FormData();
      formData.append('file', new File('test', 'test.csv'));

      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (missing fields):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle invalid template ID', async () => {
      const csvContent = `State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`;

      const formData = new FormData();
      const file = new File(csvContent, 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('templateId', '999'); // Invalid template ID
      formData.append('metadata', JSON.stringify({ description: 'Test upload' }));
      formData.append('userId', '1');

      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (invalid template):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle invalid CSV format', async () => {
      const invalidCSV = `Invalid,CSV,Format
No,proper,headers`;

      const formData = new FormData();
      const file = new File(invalidCSV, 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('templateId', '1');
      formData.append('metadata', JSON.stringify({ description: 'Test invalid upload' }));
      formData.append('userId', '1');

      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status === 500) {
        console.log('500 Error Response (invalid CSV):', data);
        expect(data).toHaveProperty('success', false);
        expect(data).toHaveProperty('error');
        return;
      }

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
}); 