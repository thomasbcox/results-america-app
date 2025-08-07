import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UnifiedCSVImportService, CSVImportResult, ValidationResult, PromotionResult, RollbackResult, DuplicateCheckResult } from './unifiedCSVImportService';
import { getDb } from '@/lib/db';
import { csvImports, csvImportMetadata, csvImportStaging, csvImportTemplates } from '@/lib/db/schema-postgres';

// Mock dependencies
jest.mock('@/lib/db');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

describe('UnifiedCSVImportService', () => {
  let mockDb: any;
  let mockFile: File;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock database
    mockDb = {
      select: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      values: jest.fn().mockReturnThis(),
      returning: jest.fn(),
      limit: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
    };

    mockGetDb.mockReturnValue(mockDb);

    // Setup default mock implementations
    mockDb.returning.mockResolvedValue([{ id: 1 }]);
    mockDb.from.mockResolvedValue([]);
    mockDb.where.mockResolvedValue([]);

    // Mock File object
    mockFile = {
      name: 'test.csv',
      size: 1024,
      type: 'text/csv',
      arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadAndStage', () => {
    const validCSV = `state,category,value,year
California,Education,85.5,2020
Texas,Education,82.3,2020`;

    beforeEach(() => {
      // Mock file content
      const encoder = new TextEncoder();
      const buffer = encoder.encode(validCSV);
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(buffer);
    });

    it('should successfully upload and stage valid CSV', async () => {
      // Mock database responses
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Import record
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Metadata record
      mockDb.from.mockResolvedValueOnce([]); // No existing imports
      mockDb.from.mockResolvedValueOnce([{ // Template
        id: 1,
        name: 'Multi-Category Template',
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
      }]);

      const result = await UnifiedCSVImportService.uploadAndStage(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(true);
      expect(result.importId).toBe(1);
      expect(result.message).toContain('CSV uploaded and staged successfully');
    });

    it('should handle duplicate file uploads', async () => {
      // Mock existing successful import
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        name: 'test.csv',
        status: 'published',
        uploadedAt: new Date()
      }]);

      const result = await UnifiedCSVImportService.uploadAndStage(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('already been imported');
    });

    it('should allow retry of failed imports', async () => {
      // Mock existing failed import
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        name: 'test.csv',
        status: 'failed',
        uploadedAt: new Date()
      }]);

      mockDb.returning.mockResolvedValueOnce([{ id: 2 }]); // New import record
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Metadata record
      mockDb.from.mockResolvedValueOnce([{ // Template
        id: 1,
        name: 'Multi-Category Template',
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
      }]);

      const result = await UnifiedCSVImportService.uploadAndStage(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(true);
    });

    it('should handle file reading errors', async () => {
      mockFile.arrayBuffer = jest.fn().mockRejectedValue(new Error('File read error'));

      const result = await UnifiedCSVImportService.uploadAndStage(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to read file');
    });

    it('should handle database errors', async () => {
      mockDb.returning.mockRejectedValueOnce(new Error('Database error'));

      const result = await UnifiedCSVImportService.uploadAndStage(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to upload CSV');
    });
  });

  describe('validateStagedData', () => {
    it('should validate staged data successfully', async () => {
      // Mock staged data
      mockDb.from.mockResolvedValueOnce([{ // Staged records
        id: 1,
        importId: 1,
        rowData: JSON.stringify({ state: 'California', category: 'Education', value: '85.5', year: '2020' }),
        rowNumber: 1,
        isValid: 1
      }]);

      // Mock template
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        name: 'Test Template',
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
      }]);

      // Mock validation dependencies
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]); // States
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics

      const result = await UnifiedCSVImportService.validateStagedData(1);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.stats.totalRows).toBe(1);
      expect(result.stats.validRows).toBe(1);
      expect(result.stats.errorRows).toBe(0);
    });

    it('should detect validation errors', async () => {
      // Mock staged data with errors
      mockDb.from.mockResolvedValueOnce([{ // Staged records
        id: 1,
        importId: 1,
        rowData: JSON.stringify({ state: 'InvalidState', category: 'Education', value: 'invalid', year: '2020' }),
        rowNumber: 1,
        isValid: 0
      }]);

      // Mock template
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        name: 'Test Template',
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
      }]);

      // Mock validation dependencies - only Education exists
      mockDb.from.mockResolvedValueOnce([]); // No states
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics

      const result = await UnifiedCSVImportService.validateStagedData(1);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.stats.errorRows).toBeGreaterThan(0);
    });

    it('should handle missing staged data', async () => {
      mockDb.from.mockResolvedValueOnce([]); // No staged data

      const result = await UnifiedCSVImportService.validateStagedData(1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No staged data found');
    });
  });

  describe('promoteToProduction', () => {
    it('should successfully promote valid data to production', async () => {
      // Mock staged data
      mockDb.from.mockResolvedValueOnce([{ // Staged records
        id: 1,
        importId: 1,
        rowData: JSON.stringify({ state: 'California', category: 'Education', value: '85.5', year: '2020' }),
        rowNumber: 1,
        isValid: 1
      }]);

      // Mock import session
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        status: 'staged',
        fileName: 'test.csv'
      }]);

      // Mock dependencies
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]); // States
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics

      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Import session
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Data points

      const result = await UnifiedCSVImportService.promoteToProduction(1, 1);

      expect(result.success).toBe(true);
      expect(result.publishedRows).toBe(1);
      expect(result.message).toContain('Successfully promoted');
    });

    it('should handle invalid staged data', async () => {
      // Mock staged data with errors
      mockDb.from.mockResolvedValueOnce([{ // Staged records
        id: 1,
        importId: 1,
        rowData: JSON.stringify({ state: 'InvalidState', category: 'Education', value: 'invalid', year: '2020' }),
        rowNumber: 1,
        isValid: 0
      }]);

      const result = await UnifiedCSVImportService.promoteToProduction(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot promote invalid data');
    });

    it('should handle missing import session', async () => {
      mockDb.from.mockResolvedValueOnce([]); // No staged data
      mockDb.from.mockResolvedValueOnce([]); // No import session

      const result = await UnifiedCSVImportService.promoteToProduction(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Import session not found');
    });
  });

  describe('rollbackPromotion', () => {
    it('should successfully rollback promotion', async () => {
      // Mock import session
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        status: 'published',
        fileName: 'test.csv'
      }]);

      // Mock data points to rollback
      mockDb.from.mockResolvedValueOnce([{ id: 1, importSessionId: 1 }]);

      mockDb.returning.mockResolvedValueOnce([{ id: 2 }]); // Rollback session
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Rollback data points

      const result = await UnifiedCSVImportService.rollbackPromotion(1, 1);

      expect(result.success).toBe(true);
      expect(result.rolledBackRows).toBe(1);
      expect(result.message).toContain('Successfully rolled back');
    });

    it('should handle non-published session', async () => {
      // Mock import session that's not published
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        status: 'staged',
        fileName: 'test.csv'
      }]);

      const result = await UnifiedCSVImportService.rollbackPromotion(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot rollback non-published session');
    });

    it('should handle missing import session', async () => {
      mockDb.from.mockResolvedValueOnce([]); // No import session

      const result = await UnifiedCSVImportService.rollbackPromotion(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Import session not found');
    });
  });

  describe('retryImport', () => {
    it('should successfully retry failed import', async () => {
      // Mock import session
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        status: 'failed',
        fileName: 'test.csv'
      }]);

      // Mock template
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        name: 'Test Template',
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
      }]);

      // Mock dependencies
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]); // States
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics

      const result = await UnifiedCSVImportService.retryImport(1, 1);

      expect(result.success).toBe(true);
      expect(result.message).toContain('Import retry completed');
    });

    it('should handle non-failed session', async () => {
      // Mock import session that's not failed
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        status: 'published',
        fileName: 'test.csv'
      }]);

      const result = await UnifiedCSVImportService.retryImport(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Cannot retry non-failed session');
    });

    it('should handle missing import session', async () => {
      mockDb.from.mockResolvedValueOnce([]); // No import session

      const result = await UnifiedCSVImportService.retryImport(1, 1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Import session not found');
    });
  });

  describe('checkDuplicateFile', () => {
    it('should detect duplicate file', async () => {
      const fileHash = 'test-hash';
      const mockSession = {
        id: 1,
        fileName: 'test.csv',
        status: 'published',
        uploadedAt: new Date()
      };

      mockDb.from.mockResolvedValueOnce([mockSession]);

      const result = await UnifiedCSVImportService.checkDuplicateFile(fileHash);

      expect(result.isDuplicate).toBe(true);
      expect(result.canRetry).toBe(false);
      expect(result.originalSession).toEqual(mockSession);
      expect(result.reason).toContain('already been published');
    });

    it('should allow retry for failed imports', async () => {
      const fileHash = 'test-hash';
      const mockSession = {
        id: 1,
        fileName: 'test.csv',
        status: 'failed',
        uploadedAt: new Date()
      };

      mockDb.from.mockResolvedValueOnce([mockSession]);

      const result = await UnifiedCSVImportService.checkDuplicateFile(fileHash);

      expect(result.isDuplicate).toBe(true);
      expect(result.canRetry).toBe(true);
      expect(result.originalSession).toEqual(mockSession);
      expect(result.reason).toContain('failed import');
    });

    it('should return no duplicate for new file', async () => {
      const fileHash = 'new-hash';

      mockDb.from.mockResolvedValueOnce([]); // No existing import

      const result = await UnifiedCSVImportService.checkDuplicateFile(fileHash);

      expect(result.isDuplicate).toBe(false);
      expect(result.canRetry).toBe(false);
      expect(result.originalSession).toBeUndefined();
    });
  });

  describe('private methods', () => {
    describe('stageData', () => {
      it('should stage data successfully', async () => {
        const records = [
          { state: 'California', category: 'Education', value: '85.5', year: '2020' }
        ];

        const template = {
          id: 1,
          name: 'Test Template',
          templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
        };

        // Mock dependencies
        mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]); // States
        mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
        mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics

        const result = await UnifiedCSVImportService['stageData'](1, records, template);

        expect(result.success).toBe(true);
        expect(result.stats.validRows).toBe(1);
        expect(result.stats.invalidRows).toBe(0);
      });

      it('should handle invalid data during staging', async () => {
        const records = [
          { state: 'InvalidState', category: 'Education', value: 'invalid', year: '2020' }
        ];

        const template = {
          id: 1,
          name: 'Test Template',
          templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
        };

        // Mock dependencies - only Education exists
        mockDb.from.mockResolvedValueOnce([]); // No states
        mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]); // Categories
        mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]); // Statistics

        const result = await UnifiedCSVImportService['stageData'](1, records, template);

        expect(result.success).toBe(false);
        expect(result.stats.invalidRows).toBeGreaterThan(0);
      });
    });

    describe('getTemplate', () => {
      it('should return template by id', async () => {
        const mockTemplate = {
          id: 1,
          name: 'Test Template',
          templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
        };

        mockDb.from.mockResolvedValue([mockTemplate]);

        const template = await UnifiedCSVImportService['getTemplate'](1);

        expect(template).toEqual(mockTemplate);
      });

      it('should return null for non-existent template', async () => {
        mockDb.from.mockResolvedValue([]);

        const template = await UnifiedCSVImportService['getTemplate'](999);

        expect(template).toBeNull();
      });
    });

    describe('getImportMetadata', () => {
      it('should return import metadata', async () => {
        const mockMetadata = {
          id: 1,
          importId: 1,
          description: 'Test import'
        };

        mockDb.from.mockResolvedValue([mockMetadata]);

        const metadata = await UnifiedCSVImportService['getImportMetadata'](1);

        expect(metadata).toEqual(mockMetadata);
      });

      it('should return null for non-existent import', async () => {
        mockDb.from.mockResolvedValue([]);

        const metadata = await UnifiedCSVImportService['getImportMetadata'](999);

        expect(metadata).toBeNull();
      });
    });
  });
}); 