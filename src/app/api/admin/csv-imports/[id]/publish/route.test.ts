import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager, JestTestHelpers } from '@/lib/test-infrastructure/jest-setup';
import { POST } from './route';

// Mock File API for testing
global.File = class File {
  constructor(public content: string, public name: string, public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('/api/admin/csv-imports/[id]/publish', () => {
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

  describe('POST', () => {
    it('should publish valid import successfully', async () => {
      // First create a valid import
      const csvContent = `State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000
Alaska,2023,Economy,GDP,50000`;

      const formData = new FormData();
      const file = new File(csvContent, 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('templateId', '1');
      formData.append('metadata', JSON.stringify({ description: 'Test publish' }));
      formData.append('userId', '1');

      const uploadRequest = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const uploadResponse = await (await import('../../route')).POST(uploadRequest);
      const uploadData = await uploadResponse.json();

      expect(uploadData.success).toBe(true);
      const importId = uploadData.data.importId;

      // Now publish the import
      const request = JestTestHelpers.createMockRequest(`/api/admin/csv-imports/${importId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ userId: 1 })
      });
      const response = await POST(request, { params: Promise.resolve({ id: importId.toString() }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle publishing invalid import', async () => {
      // Create an import with invalid data
      const invalidCSV = `State,Year,Category,Measure,Value
InvalidState,2023,Economy,GDP,200000`;

      const formData = new FormData();
      const file = new File(invalidCSV, 'test.csv', { type: 'text/csv' });
      formData.append('file', file);
      formData.append('templateId', '1');
      formData.append('metadata', JSON.stringify({ description: 'Test invalid publish' }));
      formData.append('userId', '1');

      const uploadRequest = JestTestHelpers.createMockRequest('/api/admin/csv-imports', {
        method: 'POST',
        body: formData
      });

      const uploadResponse = await (await import('../../route')).POST(uploadRequest);
      const uploadData = await uploadResponse.json();

      expect(uploadData.success).toBe(false); // Should fail due to invalid data
      const importId = uploadData.data?.importId;

      if (importId) {
        // Try to publish the failed import
        const request = JestTestHelpers.createMockRequest(`/api/admin/csv-imports/${importId}/publish`, {
          method: 'POST',
          body: JSON.stringify({ userId: 1 })
        });
        const response = await POST(request, { params: Promise.resolve({ id: importId.toString() }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.success).toBe(false);
        expect(data.error).toBeDefined();
      }
    });

    it('should handle invalid import ID', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports/999/publish', {
        method: 'POST',
        body: JSON.stringify({ userId: 1 })
      });
      const response = await POST(request, { params: Promise.resolve({ id: '999' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle non-numeric import ID', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports/invalid/publish', {
        method: 'POST',
        body: JSON.stringify({ userId: 1 })
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'invalid' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });

    it('should handle missing user ID', async () => {
      const request = JestTestHelpers.createMockRequest('/api/admin/csv-imports/1/publish', {
        method: 'POST',
        body: JSON.stringify({})
      });
      const response = await POST(request, { params: Promise.resolve({ id: '1' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });
}); 