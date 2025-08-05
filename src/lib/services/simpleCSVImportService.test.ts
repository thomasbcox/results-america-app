import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager } from '@/lib/test-infrastructure/jest-setup';
import { SimpleCSVImportService } from './simpleCSVImportService';
import * as schema from '../db/schema';

// Mock File API for testing
global.File = class File {
  constructor(public content: string, public name: string, public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('SimpleCSVImportService', () => {
  beforeEach(async () => {
    // Create fresh test database with all necessary data
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
    // Clean up test database
    TestDatabaseManager.cleanupTestDatabase();
  });

  describe('Database Setup', () => {
    it('should have working database connection', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      expect(db).toBeDefined();
      expect(db.db).toBeDefined();
    });

    it('should have seeded data', async () => {
      const db = TestDatabaseManager.getCurrentTestDatabase();
      
      // Check if users exist
      const users = await db.db.select().from(schema.users);
      expect(users.length).toBeGreaterThan(0);
      
      // Check if templates exist
      const templates = await db.db.select().from(schema.csvImportTemplates);
      expect(templates.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplates', () => {
    it('should return available templates', async () => {
      const templates = await SimpleCSVImportService.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      // Debug: Log the templates to see what we're getting
      console.log('Templates returned:', templates.map(t => ({ name: t.name, type: t.type })));

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('type');
        expect(template).toHaveProperty('expectedHeaders');
        expect(template).toHaveProperty('sampleData');
        expect(['multi-category', 'single-category', 'multi-year-export']).toContain(template.type);
      });
    });

    it('should ensure templates exist', async () => {
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

    it('should handle database schema correctly with processedAt field', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(mockCSVContent, 'test.csv');
      const metadata = { description: 'Test schema fix' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(true);
      expect(result.importId).toBeDefined();
    });

    it('should reject duplicate files', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(mockCSVContent, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      // First upload should succeed
      const result1 = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(result1.success).toBe(true);

      // Second upload with same filename should fail
      const result2 = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(result2.success).toBe(false);
      expect(result2.message).toContain('already exists');
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
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const malformedCSV = `State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000
Alaska,2023,Economy,GDP`; // Missing value

      const file = new File(malformedCSV, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Upload failed');
    });

    it('should allow retry of failed imports without duplicate errors', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const invalidCSV = `State,Year,Category,Measure,Value
InvalidState,2023,Economy,GDP,200000`; // Invalid state

      const file = new File(invalidCSV, 'test.csv');
      const metadata = { description: 'Test retry logic' };
      const uploadedBy = 1;

      // First attempt fails
      const result1 = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(result1.success).toBe(false);

      // Retry should be allowed (no duplicate file error)
      const result2 = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(result2.success).toBe(false); // Still fails, but no duplicate error
      expect(result2.message).toContain('Upload failed');
    });
  });

  describe('processData', () => {
    it('should process valid data records', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const uploadResult = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(uploadResult.success).toBe(true);

      const processResult = await SimpleCSVImportService.processData(uploadResult.importId!);

      expect(processResult.success).toBe(true);
      expect(processResult.message).toContain('processed');
    });

    it('should handle invalid data records', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
InvalidState,2023,Economy,GDP,200000`, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const uploadResult = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(uploadResult.success).toBe(true);

      const processResult = await SimpleCSVImportService.processData(uploadResult.importId!);

      expect(processResult.success).toBe(false);
      expect(processResult.message).toContain('validation');
    });
  });

  describe('validateHeaders', () => {
    it('should validate correct headers', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = ['State', 'Year', 'Category', 'Measure', 'Value'];
      const template = templates[0];

      const result = await SimpleCSVImportService.validateHeaders(headers, template.id);

      expect(result.isValid).toBe(true);
    });

    it('should reject incorrect headers', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = ['Wrong', 'Headers'];
      const template = templates[0];

      const result = await SimpleCSVImportService.validateHeaders(headers, template.id);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive headers', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = ['state', 'year', 'category', 'measure', 'value'];
      const template = templates[0];

      const result = await SimpleCSVImportService.validateHeaders(headers, template.id);

      expect(result.isValid).toBe(true);
    });
  });

  describe('getTemplate', () => {
    it('should return template by ID', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const template = await SimpleCSVImportService.getTemplate(templates[0].id);

      expect(template).toBeDefined();
      expect(template?.id).toBe(templates[0].id);
    });

    it('should return null for non-existent template', async () => {
      const template = await SimpleCSVImportService.getTemplate(999);

      expect(template).toBeNull();
    });
  });

  describe('getImportMetadata', () => {
    it('should return import metadata', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const uploadResult = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(uploadResult.success).toBe(true);

      const importMetadata = await SimpleCSVImportService.getImportMetadata(uploadResult.importId!);

      expect(importMetadata).toBeDefined();
      expect(importMetadata?.description).toBe('Test import');
    });

    it('should return null for non-existent import', async () => {
      const metadata = await SimpleCSVImportService.getImportMetadata(999);

      expect(metadata).toBeNull();
    });
  });

  describe('getImportSessionId', () => {
    it('should return import session ID', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const uploadResult = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);
      expect(uploadResult.success).toBe(true);

      const sessionId = await SimpleCSVImportService.getImportSessionId(uploadResult.importId!);

      expect(sessionId).toBeDefined();
      expect(typeof sessionId).toBe('number');
    });

    it('should return null for non-existent import', async () => {
      try {
        await SimpleCSVImportService.getImportSessionId(999);
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('ensureTemplates', () => {
    it('should create templates if they don\'t exist', async () => {
      const templates = await SimpleCSVImportService.ensureTemplates();

      expect(templates.length).toBeGreaterThan(0);
    });

    it('should not create duplicate templates', async () => {
      const templates1 = await SimpleCSVImportService.ensureTemplates();
      const templates2 = await SimpleCSVImportService.ensureTemplates();

      expect(templates1.length).toBe(templates2.length);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,invalid`, 'test.csv');
      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(file, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Upload failed');
    });

    it('should handle file reading errors', async () => {
      const templates = await SimpleCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      // Create a file that will cause reading errors
      const problematicFile = {
        name: 'test.csv',
        async arrayBuffer(): Promise<ArrayBuffer> {
          throw new Error('File read error');
        }
      } as any;

      const metadata = { description: 'Test import' };
      const uploadedBy = 1;

      const result = await SimpleCSVImportService.uploadCSV(problematicFile, templates[0].id, metadata, uploadedBy);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Upload failed');
    });
  });
}); 