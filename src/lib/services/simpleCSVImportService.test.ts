import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { setupTestDatabase, seedTestData, cleanupTestDatabase, getTestDb } from '../test-setup';
import { SimpleCSVImportService } from './simpleCSVImportService';
import { csvImports, csvImportMetadata, csvImportStaging, csvImportTemplates } from '../db/schema';
import { eq } from 'drizzle-orm';

// Mock the database
jest.mock('../db/index', () => ({
  getDb: () => {
    const { getTestDb } = require('../test-setup');
    return getTestDb();
  }
}));

// Mock File API
global.File = class File {
  constructor(public content: string, public name: string) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('SimpleCSVImportService', () => {
  let db: any;

  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestData();
    db = getTestDb();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Clean up any test data
    await db.delete(csvImports);
    await db.delete(csvImportMetadata);
    await db.delete(csvImportStaging);
    await db.delete(csvImportTemplates);
  });

  describe('getTemplates', () => {
    it('should return available templates', async () => {
      const templates = await SimpleCSVImportService.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('expectedHeaders');
        expect(template).toHaveProperty('sampleData');
        expect(['multi-category', 'single-category']).toContain(template.type);
      });
    });

    it('should ensure templates exist', async () => {
      // Delete existing templates
      await db.delete(csvImportTemplates);

      const templates = await SimpleCSVImportService.getTemplates();

      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('uploadCSV', () => {
    const mockCSVContent = `State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000
Alaska,2023,Economy,GDP,50000`;

    it('should successfully upload a valid CSV file', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(mockCSVContent, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(true);
      expect(result.importId).toBeDefined();
      expect(result.message).toContain('successfully');
      expect(result.stats).toBeDefined();
      expect(result.stats?.totalRows).toBeGreaterThan(0);
    });

    it('should reject duplicate files', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(mockCSVContent, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      // First upload
      await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      // Second upload with same content
      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already been uploaded');
      expect(result.errors).toContain('Duplicate file detected');
    });

    it('should handle invalid template ID', async () => {
      const file = new File(mockCSVContent, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(file, 999, metadata, uploadedBy);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Template not found');
    });

    it('should handle malformed CSV', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const malformedCSV = `Invalid,CSV,Content
No,proper,headers
or,data,format`;
      const file = new File(malformedCSV, 'malformed.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.length).toBeGreaterThan(0);
    });
  });

  describe('processData', () => {
    it('should process valid data records', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const importId = 1;
      const records = [
        {
          State: 'Alabama',
          Year: '2023',
          Category: 'Economy',
          Measure: 'GDP',
          Value: '200000'
        }
      ];
      const template = {
        id: templates[0].id,
        name: templates[0].name,
        description: templates[0].description,
        type: templates[0].type,
        expectedHeaders: templates[0].expectedHeaders,
        sampleData: templates[0].sampleData
      };

      const result = await SimpleCSVImportService.processData(importId, records, template);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.totalRows).toBe(1);
      expect(result.stats.validRows).toBe(1);
      expect(result.stats.invalidRows).toBe(0);
    });

    it('should handle invalid data records', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const importId = 1;
      const records = [
        {
          State: 'Invalid State',
          Year: '2023',
          Category: 'Economy',
          Measure: 'GDP',
          Value: 'invalid'
        }
      ];
      const template = {
        id: templates[0].id,
        name: templates[0].name,
        description: templates[0].description,
        type: templates[0].type,
        expectedHeaders: templates[0].expectedHeaders,
        sampleData: templates[0].sampleData
      };

      const result = await SimpleCSVImportService.processData(importId, records, template);

      expect(result.success).toBe(true);
      expect(result.stats).toBeDefined();
      expect(result.stats.invalidRows).toBeGreaterThan(0);
    });
  });

  describe('validateHeaders', () => {
    it('should validate correct headers', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = {
        State: 'Alabama',
        Year: '2023',
        Category: 'Economy',
        Measure: 'GDP',
        Value: '200000'
      };
      const template = {
        id: templates[0].id,
        name: templates[0].name,
        description: templates[0].description,
        type: templates[0].type,
        expectedHeaders: templates[0].expectedHeaders,
        sampleData: templates[0].sampleData
      };

      const result = SimpleCSVImportService.validateHeaders(headers, template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject incorrect headers', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = {
        State: 'Alabama',
        Wrong: 'Data',
        Headers: 'Invalid',
        Invalid: 'Format',
        Data: 'Test'
      };
      const template = {
        id: templates[0].id,
        name: templates[0].name,
        description: templates[0].description,
        type: templates[0].type,
        expectedHeaders: templates[0].expectedHeaders,
        sampleData: templates[0].sampleData
      };

      const result = SimpleCSVImportService.validateHeaders(headers, template);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive headers', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = {
        state: 'Alabama',
        year: '2023',
        category: 'Economy',
        measure: 'GDP',
        value: '200000'
      };
      const template = {
        id: templates[0].id,
        name: templates[0].name,
        description: templates[0].description,
        type: templates[0].type,
        expectedHeaders: templates[0].expectedHeaders,
        sampleData: templates[0].sampleData
      };

      const result = SimpleCSVImportService.validateHeaders(headers, template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const firstTemplateId = templates[0].id;
      const template = await SimpleCSVImportService.getTemplate(firstTemplateId);

      expect(template).toBeDefined();
      expect(template?.id).toBe(firstTemplateId);
      expect(template?.name).toBeDefined();
      expect(template?.description).toBeDefined();
      expect(template?.type).toBeDefined();
      expect(template?.expectedHeaders).toBeDefined();
    });

    it('should return null for non-existent template', async () => {
      const template = await SimpleCSVImportService.getTemplate(999);

      expect(template).toBeNull();
    });
  });

  describe('getImportMetadata', () => {
    it('should return import metadata', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      // First create an import
      const file = new File('State,Value\nAlabama,100', 'test.csv');
      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, { description: 'Test' }, 1);
      
      if (result.success && result.importId) {
        const metadata = await SimpleCSVImportService.getImportMetadata(result.importId);

        expect(metadata).toBeDefined();
        expect(metadata.importId).toBe(result.importId);
        expect(metadata.description).toBe('Test');
      }
    });

    it('should return null for non-existent import', async () => {
      const metadata = await SimpleCSVImportService.getImportMetadata(999);

      expect(metadata).toBeNull();
    });
  });

  describe('getImportSessionId', () => {
    it('should return import session ID', async () => {
      // Get the first available template
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      // First create an import
      const file = new File('State,Value\nAlabama,100', 'test.csv');
      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, { description: 'Test' }, 1);
      
      if (result.success && result.importId) {
        const sessionId = await SimpleCSVImportService.getImportSessionId(result.importId);

        expect(sessionId).toBeDefined();
        expect(typeof sessionId).toBe('number');
      }
    });

    it('should return null for non-existent import', async () => {
      const sessionId = await SimpleCSVImportService.getImportSessionId(999);

      expect(sessionId).toBeNull();
    });
  });

  describe('ensureTemplates', () => {
    it('should create templates if they don\'t exist', async () => {
      // Delete existing templates
      await db.delete(csvImportTemplates);

      await SimpleCSVImportService.ensureTemplates();

      const templates = await db.select().from(csvImportTemplates);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should not create duplicate templates', async () => {
      const initialCount = await db.select().from(csvImportTemplates).then(r => r.length);

      await SimpleCSVImportService.ensureTemplates();

      const finalCount = await db.select().from(csvImportTemplates).then(r => r.length);
      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Test with invalid data that might cause database errors
      const invalidRecords = [
        { invalid: 'data' }
      ];
      const template = {
        id: 1,
        name: 'Test Template',
        description: 'Test template',
        type: 'single-category' as const,
        expectedHeaders: ['State', 'Value'],
        sampleData: ''
      };

      const result = await SimpleCSVImportService.processData(1, invalidRecords, template);

      expect(result.success).toBe(true);
      expect(result.stats.invalidRows).toBeGreaterThan(0);
    });

    it('should handle file reading errors', async () => {
      // Mock a file that throws an error
      const mockFile = {
        arrayBuffer: () => Promise.reject(new Error('File read error'))
      } as any;

      const result = await SimpleCSVImportService.uploadCSV(mockFile, 1, {}, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('error');
    });
  });
}); 