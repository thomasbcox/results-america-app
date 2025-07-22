import { createTestDb } from '../db/testDb';
import * as importExportService from './importExportService';
import { clearAllTestData } from './testUtils';

let db;

beforeEach(async () => {
  db = createTestDb();
  // Mock the service functions to use the test database
  jest.spyOn(require('./statesService'), 'createState').mockImplementation(async (data) => {
    return [{ id: 1, ...data }];
  });
  jest.spyOn(require('./categoriesService'), 'createCategory').mockImplementation(async (data) => {
    return [{ id: 1, ...data }];
  });
});

afterEach(async () => {
  await clearAllTestData(db);
  jest.restoreAllMocks();
});

describe('importExportService', () => {
  describe('importStatesFromCSV', () => {
    it('should import states from valid CSV', async () => {
      const csvData = `name,abbreviation
California,CA
Texas,TX
New York,NY`;

      const result = await importExportService.importStatesFromCSV(csvData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('Imported 3 states');
    });

    it('should handle CSV with errors', async () => {
      const csvData = `name,abbreviation
California,CA
Invalid Line
Texas,TX`;

      const result = await importExportService.importStatesFromCSV(csvData);

      expect(result.success).toBe(false);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Line 3: Invalid format');
    });

    it('should handle empty CSV', async () => {
      const csvData = 'name,abbreviation\n';

      const result = await importExportService.importStatesFromCSV(csvData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(0);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('importCategoriesFromCSV', () => {
    it('should import categories from valid CSV', async () => {
      const csvData = `name,description,icon,sortOrder
Education,K-12 and higher education metrics,GraduationCap,1
Economy,Economic indicators and employment,DollarSign,2`;

      const result = await importExportService.importCategoriesFromCSV(csvData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(result.message).toContain('Imported 2 categories');
    });

    it('should handle missing optional fields', async () => {
      const csvData = `name,description
Education,K-12 and higher education metrics`;

      const result = await importExportService.importCategoriesFromCSV(csvData);

      expect(result.success).toBe(true);
      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('exportData', () => {
    it('should export data in JSON format', async () => {
      const options = {
        format: 'json' as const,
        includeMetadata: true
      };

      const result = await importExportService.exportData(options);

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed).toHaveProperty('states');
      expect(parsed).toHaveProperty('categories');
      expect(parsed).toHaveProperty('statistics');
      expect(parsed.metadata.format).toBe('json');
    });

    it('should export data in CSV format', async () => {
      const options = {
        format: 'csv' as const,
        includeMetadata: false
      };

      const result = await importExportService.exportData(options);

      expect(typeof result).toBe('string');
      expect(result).toContain('=== STATES ===');
      expect(result).toContain('=== CATEGORIES ===');
      expect(result).toContain('=== STATISTICS ===');
    });

    it('should handle XLSX format error', async () => {
      const options = {
        format: 'xlsx' as const,
        includeMetadata: true
      };

      await expect(importExportService.exportData(options)).rejects.toThrow('XLSX format not yet implemented');
    });

    it('should export filtered data', async () => {
      const options = {
        format: 'json' as const,
        includeMetadata: true,
        filters: {
          category: 'Education',
          year: 2023
        }
      };

      const result = await importExportService.exportData(options);

      const parsed = JSON.parse(result);
      expect(parsed).toHaveProperty('metadata');
      expect(parsed.metadata.filters).toEqual(options.filters);
    });
  });
}); 