import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SimpleCSVImportService, SimpleCSVTemplate, CSVImportResult } from './simpleCSVImportService';
import { getDb } from '@/lib/db';
import { csvImportTemplates, csvImports, csvImportMetadata, csvImportStaging } from '@/lib/db/schema';

// Mock dependencies
jest.mock('@/lib/db');

const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

describe('SimpleCSVImportService', () => {
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

  describe('getTemplates', () => {
    it('should return available templates', async () => {
      const mockTemplates = [
        {
          id: 1,
          name: 'Multi-Category Template',
          description: 'Template for multi-category data',
          isActive: 1,
          templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] }),
          sampleData: 'sample data'
        },
        {
          id: 2,
          name: 'Single Category Template',
          description: 'Template for single category data',
          isActive: 1,
          templateSchema: JSON.stringify({ expectedHeaders: ['state', 'value', 'year'] }),
          sampleData: ''
        }
      ];

      mockDb.from.mockResolvedValue(mockTemplates);

      const templates = await SimpleCSVImportService.getTemplates();

      expect(templates).toHaveLength(2);
      expect(templates[0]).toEqual({
        id: 1,
        name: 'Multi-Category Template',
        description: 'Template for multi-category data',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: 'sample data'
      });
      expect(templates[1].type).toBe('single-category');
    });

    it('should ensure templates exist before returning', async () => {
      mockDb.from.mockResolvedValue([]);

      await SimpleCSVImportService.getTemplates();

      // Should call ensureTemplates which would insert templates
      expect(mockDb.insert).toHaveBeenCalledWith(csvImportTemplates);
    });
  });

  describe('uploadCSV', () => {
    const validCSV = `state,category,value,year
California,Education,85.5,2020
Texas,Education,82.3,2020`;

    beforeEach(() => {
      // Mock file content
      const encoder = new TextEncoder();
      const buffer = encoder.encode(validCSV);
      mockFile.arrayBuffer = jest.fn().mockResolvedValue(buffer);
    });

    it('should successfully upload valid CSV', async () => {
      // Mock database responses
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Import record
      mockDb.returning.mockResolvedValueOnce([{ id: 1 }]); // Metadata record
      mockDb.from.mockResolvedValueOnce([]); // No existing imports
      mockDb.from.mockResolvedValueOnce([{ // Template
        id: 1,
        name: 'Multi-Category Template',
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] })
      }]);

      const result = await SimpleCSVImportService.uploadCSV(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(true);
      expect(result.importId).toBe(1);
      expect(result.message).toContain('CSV uploaded successfully');
    });

    it('should handle duplicate file uploads', async () => {
      // Mock existing successful import
      mockDb.from.mockResolvedValueOnce([{
        id: 1,
        name: 'test.csv',
        status: 'imported',
        uploadedAt: new Date()
      }]);

      const result = await SimpleCSVImportService.uploadCSV(
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

      const result = await SimpleCSVImportService.uploadCSV(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(true);
    });

    it('should handle file reading errors', async () => {
      mockFile.arrayBuffer = jest.fn().mockRejectedValue(new Error('File read error'));

      const result = await SimpleCSVImportService.uploadCSV(
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

      const result = await SimpleCSVImportService.uploadCSV(
        mockFile,
        1,
        { description: 'Test import' },
        1
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to upload CSV');
    });
  });

  describe('validateHeaders', () => {
    it('should validate correct headers', () => {
      const template: SimpleCSVTemplate = {
        id: 1,
        name: 'Test Template',
        description: 'Test',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: ''
      };

      const headers = ['state', 'category', 'value', 'year'];
      const result = SimpleCSVImportService.validateHeaders(headers, template);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing headers', () => {
      const template: SimpleCSVTemplate = {
        id: 1,
        name: 'Test Template',
        description: 'Test',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: ''
      };

      const headers = ['state', 'category', 'value']; // Missing 'year'
      const result = SimpleCSVImportService.validateHeaders(headers, template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required header: year');
    });

    it('should detect extra headers', () => {
      const template: SimpleCSVTemplate = {
        id: 1,
        name: 'Test Template',
        description: 'Test',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: ''
      };

      const headers = ['state', 'category', 'value', 'year', 'extra'];
      const result = SimpleCSVImportService.validateHeaders(headers, template);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Unexpected header: extra');
    });
  });

  describe('getTemplate', () => {
    it('should return template by id', async () => {
      const mockTemplate = {
        id: 1,
        name: 'Test Template',
        description: 'Test',
        isActive: 1,
        templateSchema: JSON.stringify({ expectedHeaders: ['state', 'category', 'value', 'year'] }),
        sampleData: 'sample'
      };

      mockDb.from.mockResolvedValue([mockTemplate]);

      const template = await SimpleCSVImportService.getTemplate(1);

      expect(template).toEqual({
        id: 1,
        name: 'Test Template',
        description: 'Test',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: 'sample'
      });
    });

    it('should return null for non-existent template', async () => {
      mockDb.from.mockResolvedValue([]);

      const template = await SimpleCSVImportService.getTemplate(999);

      expect(template).toBeNull();
    });
  });

  describe('getImportMetadata', () => {
    it('should return import metadata', async () => {
      const mockMetadata = {
        id: 1,
        importId: 1,
        description: 'Test import',
        dataYear: 2020,
        dataSource: 'Test Source'
      };

      mockDb.from.mockResolvedValue([mockMetadata]);

      const metadata = await SimpleCSVImportService.getImportMetadata(1);

      expect(metadata).toEqual(mockMetadata);
    });

    it('should return null for non-existent import', async () => {
      mockDb.from.mockResolvedValue([]);

      const metadata = await SimpleCSVImportService.getImportMetadata(999);

      expect(metadata).toBeNull();
    });
  });

  describe('getImportSessionId', () => {
    it('should return existing session id', async () => {
      const mockSession = { id: 1, importId: 1 };

      mockDb.from.mockResolvedValue([mockSession]);

      const sessionId = await SimpleCSVImportService.getImportSessionId(1);

      expect(sessionId).toBe(1);
    });

    it('should create new session if none exists', async () => {
      mockDb.from.mockResolvedValue([]);
      mockDb.returning.mockResolvedValue([{ id: 2 }]);

      const sessionId = await SimpleCSVImportService.getImportSessionId(1);

      expect(sessionId).toBe(2);
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('processData', () => {
    it('should process valid data successfully', async () => {
      const template: SimpleCSVTemplate = {
        id: 1,
        name: 'Test Template',
        description: 'Test',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: ''
      };

      const records = [
        { state: 'California', category: 'Education', value: '85.5', year: '2020' },
        { state: 'Texas', category: 'Education', value: '82.3', year: '2020' }
      ];

      // Mock database responses for validation
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Test Source' }]);

      const result = await SimpleCSVImportService.processData(1, records, template);

      expect(result.success).toBe(true);
      expect(result.stats.validRows).toBe(2);
      expect(result.stats.invalidRows).toBe(0);
    });

    it('should handle invalid data', async () => {
      const template: SimpleCSVTemplate = {
        id: 1,
        name: 'Test Template',
        description: 'Test',
        type: 'multi-category',
        expectedHeaders: ['state', 'category', 'value', 'year'],
        sampleData: ''
      };

      const records = [
        { state: 'InvalidState', category: 'Education', value: 'invalid', year: '2020' },
        { state: 'California', category: 'Education', value: '85.5', year: '2020' }
      ];

      // Mock database responses - only California exists
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'California' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Education' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Graduation Rate' }]);
      mockDb.from.mockResolvedValueOnce([{ id: 1, name: 'Test Source' }]);

      const result = await SimpleCSVImportService.processData(1, records, template);

      expect(result.success).toBe(false);
      expect(result.stats.invalidRows).toBeGreaterThan(0);
    });
  });

  describe('ensureTemplates', () => {
    it('should create templates if they do not exist', async () => {
      mockDb.from.mockResolvedValue([]); // No existing templates

      await SimpleCSVImportService.ensureTemplates();

      expect(mockDb.insert).toHaveBeenCalledWith(csvImportTemplates);
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'Multi-Category Template' }),
          expect.objectContaining({ name: 'Single Category Template' })
        ])
      );
    });

    it('should not create templates if they already exist', async () => {
      mockDb.from.mockResolvedValue([{ id: 1, name: 'Multi-Category Template' }]);

      await SimpleCSVImportService.ensureTemplates();

      expect(mockDb.insert).not.toHaveBeenCalled();
    });
  });
}); 