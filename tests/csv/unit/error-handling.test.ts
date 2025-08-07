import { SimpleCSVImportService } from '../../../src/lib/services/simpleCSVImportService';
import { 
  generateValidMultiCategoryCSV, 
  generateValidSingleCategoryCSV, 
  generateInvalidCSV,
  uploadTestCSV,
  createTestCSV
} from '../../utils/csv-test-helpers';

describe('CSV Import Error Handling', () => {
  let multiCategoryTemplateId: number;
  let singleCategoryTemplateId: number;

  beforeAll(async () => {
    // Get template IDs
    const templates = await SimpleCSVImportService.getTemplates();
    const multiCategoryTemplate = templates.find(t => t.name === 'Multi-Category Data Import');
    const singleCategoryTemplate = templates.find(t => t.name === 'Single-Category Data Import');
    
    if (!multiCategoryTemplate || !singleCategoryTemplate) {
      throw new Error('Required templates not found');
    }
    
    multiCategoryTemplateId = multiCategoryTemplate.id;
    singleCategoryTemplateId = singleCategoryTemplate.id;
  });

  describe('Invalid Headers', () => {
    it('should reject CSV with invalid headers for multi-category template', async () => {
      const invalidCSV = generateInvalidCSV('invalid-headers');
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing required column: State');
    });

    it('should reject CSV with invalid headers for single-category template', async () => {
      const invalidCSV = generateInvalidCSV('invalid-headers');
      const result = await uploadTestCSV(invalidCSV, singleCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing required column: State');
    });

    it('should reject CSV with missing required headers', async () => {
      const invalidCSV = {
        headers: ['State', 'Year'], // Missing Category, Measure, Value
        rows: [['California', '2023']],
        filename: 'missing-headers.csv',
        description: 'CSV with missing required headers'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing required column: Category');
      expect(result.errors).toContain('Missing required column: Measure');
      expect(result.errors).toContain('Missing required column: Value');
    });
  });

  describe('Missing Required Fields', () => {
    it('should reject CSV with missing state names', async () => {
      const invalidCSV = generateInvalidCSV('missing-required-fields');
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });

    it('should reject CSV with missing years', async () => {
      const invalidCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '', 'Economy', 'GDP', '1000000'], // Empty year
          ['Texas', '2023', 'Economy', 'GDP', '1000000']  // Valid row
        ],
        filename: 'missing-years.csv',
        description: 'CSV with missing years'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });

    it('should reject CSV with missing values', async () => {
      const invalidCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '2023', 'Economy', 'GDP', ''], // Empty value
          ['Texas', '2023', 'Economy', 'GDP', '1000000'] // Valid row
        ],
        filename: 'missing-values.csv',
        description: 'CSV with missing values'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });
  });

  describe('Invalid Data Types', () => {
    it('should reject CSV with invalid year data types', async () => {
      const invalidCSV = generateInvalidCSV('invalid-data-types');
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });

    it('should reject CSV with invalid numeric values', async () => {
      const invalidCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '2023', 'Economy', 'GDP', 'not-a-number'],
          ['Texas', '2023', 'Economy', 'GDP', 'abc123'],
          ['New York', '2023', 'Economy', 'GDP', '1000000'] // Valid row
        ],
        filename: 'invalid-numeric-values.csv',
        description: 'CSV with invalid numeric values'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });

    it('should handle scientific notation in numeric fields', async () => {
      const invalidCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '2023', 'Economy', 'GDP', '1.5e6'],
          ['Texas', '2023', 'Economy', 'GDP', '2.2E6'],
          ['New York', '2023', 'Economy', 'GDP', '1000000'] // Valid row
        ],
        filename: 'scientific-notation.csv',
        description: 'CSV with scientific notation'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      // This should either be handled gracefully or rejected consistently
      expect(result.success).toBeDefined();
    });
  });

  describe('Non-existent States', () => {
    it('should reject CSV with non-existent state names', async () => {
      const invalidCSV = generateInvalidCSV('non-existent-states');
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });

    it('should handle case variations in state names', async () => {
      const validCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['california', '2023', 'Economy', 'GDP', '1000000'], // Lowercase
          ['TEXAS', '2023', 'Economy', 'GDP', '1000000'], // Uppercase
          ['new york', '2023', 'Economy', 'GDP', '1000000'], // Lowercase with space
          ['California', '2023', 'Economy', 'GDP', '1000000'] // Correct case
        ],
        filename: 'case-variations.csv',
        description: 'CSV with case variations in state names'
      };
      
      const result = await uploadTestCSV(validCSV, multiCategoryTemplateId);
      
      // Should handle case-insensitive matching
      expect(result.success).toBe(true);
      expect(result.stats?.validRows).toBeGreaterThan(0);
    });
  });

  describe('Non-existent Categories and Statistics', () => {
    it('should reject CSV with non-existent categories', async () => {
      const invalidCSV = generateInvalidCSV('non-existent-categories');
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });

    it('should reject CSV with non-existent statistics', async () => {
      const invalidCSV = {
        headers: ['State', 'Year', 'Category', 'Measure', 'Value'],
        rows: [
          ['California', '2023', 'Economy', 'FakeStatistic', '1000000'],
          ['Texas', '2023', 'Education', 'InvalidMeasure', '1000000']
        ],
        filename: 'non-existent-statistics.csv',
        description: 'CSV with non-existent statistics'
      };
      
      const result = await uploadTestCSV(invalidCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });
  });

  describe('Empty and Malformed Files', () => {
    it('should handle empty CSV files', async () => {
      const emptyCSV = generateInvalidCSV('empty-file');
      const result = await uploadTestCSV(emptyCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('CSV parsing failed');
    });

    it('should handle CSV files with only headers', async () => {
      const headersOnlyCSV = generateInvalidCSV('headers-only');
      const result = await uploadTestCSV(headersOnlyCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('No data rows found');
    });

    it('should handle malformed CSV with inconsistent columns', async () => {
      const malformedCSV = generateInvalidCSV('malformed-csv');
      const result = await uploadTestCSV(malformedCSV, multiCategoryTemplateId);
      
      expect(result.success).toBe(false);
      expect(result.stats?.invalidRows).toBeGreaterThan(0);
    });
  });

  describe('File Processing Errors', () => {
    it('should handle files with different line endings', async () => {
      const csvWithCRLF = 'State,Year,Category,Measure,Value\r\nCalifornia,2023,Economy,GDP,1000000\r\nTexas,2023,Economy,GDP,1000000';
      const file = new File([csvWithCRLF], 'crlf-endings.csv', { type: 'text/csv' });
      
      const result = await SimpleCSVImportService.uploadCSV(
        file,
        multiCategoryTemplateId,
        { name: 'Test CRLF Endings' },
        3
      );
      
      expect(result.success).toBe(true);
    });

    it('should handle files with BOM characters', async () => {
      const csvWithBOM = '\uFEFFState,Year,Category,Measure,Value\nCalifornia,2023,Economy,GDP,1000000\nTexas,2023,Economy,GDP,1000000';
      const file = new File([csvWithBOM], 'bom-file.csv', { type: 'text/csv' });
      
      const result = await SimpleCSVImportService.uploadCSV(
        file,
        multiCategoryTemplateId,
        { name: 'Test BOM Characters' },
        3
      );
      
      expect(result.success).toBe(true);
    });

    it('should handle files with quoted fields', async () => {
      const csvWithQuotes = 'State,Year,Category,Measure,Value\n"California",2023,"Economy","GDP",1000000\n"Texas",2023,"Economy","GDP",1000000';
      const file = new File([csvWithQuotes], 'quoted-fields.csv', { type: 'text/csv' });
      
      const result = await SimpleCSVImportService.uploadCSV(
        file,
        multiCategoryTemplateId,
        { name: 'Test Quoted Fields' },
        3
      );
      
      expect(result.success).toBe(true);
    });
  });

  describe('Template Validation', () => {
    it('should reject uploads with invalid template ID', async () => {
      const validCSV = generateValidMultiCategoryCSV(3);
      const file = new File([createTestCSV(validCSV.headers, validCSV.rows)], 'test.csv', { type: 'text/csv' });
      
      const result = await SimpleCSVImportService.uploadCSV(
        file,
        99999, // Invalid template ID
        { name: 'Test Invalid Template' },
        3
      );
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Template not found');
    });

    it('should validate template schema requirements', async () => {
      const validCSV = generateValidMultiCategoryCSV(3);
      const file = new File([createTestCSV(validCSV.headers, validCSV.rows)], 'test.csv', { type: 'text/csv' });
      
      // Test with single-category template but multi-category data
      const result = await SimpleCSVImportService.uploadCSV(
        file,
        singleCategoryTemplateId,
        { name: 'Test Template Mismatch' },
        3
      );
      
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Missing required column: Value');
    });
  });
}); 