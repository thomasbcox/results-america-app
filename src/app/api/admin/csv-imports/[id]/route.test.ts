import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager, JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
import { GET } from './route';

// Mock File API for testing
global.File = class File {
  constructor(public content: string, public name: string, public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('/api/admin/csv-imports/[id]', () => {
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
    it('should return import details for valid ID', async () => {
      // First create an import to get a valid ID
      const csvContent = `State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`;

      const formData = new FormData();
      const file = new File(csvContent, 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('templateId', '1');
      formData.append('metadata', JSON.stringify({ description: 'Test import' }));
      formData.append('userId', '1');

      const uploadRequest = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const uploadResponse = await (await import('../route')).POST(uploadRequest);
      const uploadData = await uploadResponse.json();

      expect(uploadData.success).toBe(true);
      const importId = uploadData.data.importId;

      // Now get the details
      const request = JestTestHelpers.createMockRequest(`/api/admin/csv-imports/${importId}`);
      const response = await GET(request, { params: Promise.resolve({ id: importId.toString() }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.id).toBe(importId);
      expect(data.data.fileName).toBe('test.csv');
    });

    it('should handle invalid import ID', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports/999');
      const response = await GET(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle non-numeric import ID', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports/invalid');
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
}); 