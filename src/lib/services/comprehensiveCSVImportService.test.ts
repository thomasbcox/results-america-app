import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { TestDatabaseManager } from '@/lib/test-infrastructure/jest-setup';
import { ComprehensiveCSVImportService } from './comprehensiveCSVImportService';

// Mock File API for testing
global.File = class File {
  constructor(public content: string, public name: string, public options?: any) {}
  async arrayBuffer(): Promise<ArrayBuffer> {
    return new TextEncoder().encode(this.content).buffer;
  }
} as any;

describe('ComprehensiveCSVImportService', () => {
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

  describe('getTemplates', () => {
    it('should return comprehensive templates', async () => {
      const templates = await ComprehensiveCSVImportService.getTemplates();

      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);

      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('description');
        expect(template).toHaveProperty('validationRules');
        expect(template).toHaveProperty('columnMappings');
      });
    });
  });

  describe('validateHeaders', () => {
    it('should validate headers with comprehensive rules', async () => {
      const templates = await ComprehensiveCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = ['State', 'Year', 'Category', 'Measure', 'Value'];
      const template = templates[0];

      const result = await ComprehensiveCSVImportService.validateHeaders(headers, template.id);

      expect(result.isValid).toBe(true);
      expect(result.errors).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should provide detailed header validation feedback', async () => {
      const templates = await ComprehensiveCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const headers = ['State', 'Year', 'Category']; // Missing required columns
      const template = templates[0];

      const result = await ComprehensiveCSVImportService.validateHeaders(headers, template.id);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getImportDetails', () => {
    it('should return comprehensive import details', async () => {
      const templates = await ComprehensiveCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`, 'test.csv');
      const metadata = { description: 'Test comprehensive details' };
      const uploadedBy = 1;

      const uploadResult = await ComprehensiveCSVImportService.uploadAndValidate(
        file,
        templates[0].id,
        metadata,
        uploadedBy
      );
      expect(uploadResult.success).toBe(true);

      const details = await ComprehensiveCSVImportService.getImportDetails(uploadResult.importId!);

      expect(details).toBeDefined();
      expect(details!.id).toBe(uploadResult.importId);
      expect(details!.fileName).toBe('test.csv');
      expect(details!.validationSummary).toBeDefined();
    });

    it('should return null for non-existent import', async () => {
      const details = await ComprehensiveCSVImportService.getImportDetails(999);

      expect(details).toBeNull();
    });
  });

  describe('listImports', () => {
    it('should list imports with comprehensive filtering', async () => {
      // Create multiple imports
      const templates = await ComprehensiveCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file1 = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,200000`, 'test1.csv');
      const file2 = new File(`State,Year,Category,Measure,Value
Alaska,2023,Economy,GDP,50000`, 'test2.csv');

      const metadata = { description: 'Test listing' };
      const uploadedBy = 1;

      await ComprehensiveCSVImportService.uploadAndValidate(file1, templates[0].id, metadata, uploadedBy);
      await ComprehensiveCSVImportService.uploadAndValidate(file2, templates[0].id, metadata, uploadedBy);

      const imports = await ComprehensiveCSVImportService.listImports({
        uploadedBy,
        status: 'validated'
      });

      expect(imports.length).toBeGreaterThanOrEqual(2);
      expect(imports.every(imp => imp.uploadedBy === uploadedBy)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const templates = await ComprehensiveCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      const file = new File(`State,Year,Category,Measure,Value
Alabama,2023,Economy,GDP,invalid_value`, 'test.csv');
      const metadata = { description: 'Test error handling' };
      const uploadedBy = 1;

      const result = await ComprehensiveCSVImportService.uploadAndValidate(
        file,
        templates[0].id,
        metadata,
        uploadedBy
      );

      expect(result.success).toBe(false);
      expect(result.validationErrors).toBeDefined();
    });

    it('should handle file reading errors', async () => {
      const templates = await ComprehensiveCSVImportService.getTemplates();
      expect(templates.length).toBeGreaterThan(0);
      
      // Create a file that will cause reading errors
      const problematicFile = {
        name: 'test.csv',
        async arrayBuffer(): Promise<ArrayBuffer> {
          throw new Error('File read error');
        }
      } as any;

      const metadata = { description: 'Test file error' };
      const uploadedBy = 1;

      const result = await ComprehensiveCSVImportService.uploadAndValidate(
        problematicFile,
        templates[0].id,
        metadata,
        uploadedBy
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
}); 