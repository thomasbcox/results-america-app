import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager, JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
import { GET, POST } from './route';

// Mock File API for testing
global.File = class File {
  constructor(public content: string, public name: string, public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('/api/admin/csv-imports', () => {
  beforeEach(async () => {
    await TestDatabaseManager.createTestDatabase({
      seed: true,
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        users: true,
        csvTemplates: true
      }
    });
  });

  afterEach(() => {
    TestDatabaseManager.cleanupTestDatabase();
  });

  describe('GET', () => {
    it('should return list of CSV imports', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should handle pagination parameters', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports?page=1&limit=10');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should filter by status', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports?status=staged');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
    });

    it('should filter by uploaded by user', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports?uploadedBy=1');
      const response = await GET(request);
      const data = await response.json();

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

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
}); 