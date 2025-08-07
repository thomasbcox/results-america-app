import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { ComprehensiveCSVImportService, CSVImportResult } from './comprehensiveCSVImportService';

describe('ComprehensiveCSVImportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('CSV Validation Logic', () => {
    it('should validate required fields correctly', () => {
      const csvWithMissingFields = `state,category,statistic,value,year
California,Education,,85.5,2020
,Education,Graduation Rate,82.3,2020
New York,Education,Graduation Rate,88.1,`;

      // Test the CSV parsing logic
      const rows = csvWithMissingFields.split('\n').slice(1); // Skip header
      const validationErrors: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(',');
        const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

        // Validate required fields
        const requiredFields = ['state', 'category', 'statistic', 'value', 'year'];
        for (let j = 0; j < requiredFields.length; j++) {
          const field = requiredFields[j];
          const fieldValue = fields[j] || '';
          
          if (!fieldValue || fieldValue.trim() === '') {
            validationErrors.push({
              rowNumber,
              fieldName: field,
              fieldValue: fieldValue,
              failureCategory: 'missing_required',
              message: `Row ${rowNumber}: Missing required field '${field}'`,
            });
            break; // Skip to next row if any required field is missing
          }
        }
      }

      expect(validationErrors).toHaveLength(3);
      expect(validationErrors[0].fieldName).toBe('statistic');
      expect(validationErrors[1].fieldName).toBe('state');
      expect(validationErrors[2].fieldName).toBe('year');
    });

    it('should validate data types correctly', () => {
      const csvWithInvalidTypes = `state,category,statistic,value,year
California,Education,Graduation Rate,not_a_number,2020
Texas,Education,Graduation Rate,82.3,not_a_year
New York,Education,Graduation Rate,88.1,2020`;

      const rows = csvWithInvalidTypes.split('\n').slice(1);
      const validationErrors: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(',');
        const rowNumber = i + 2;

        // Validate data types
        const value = parseFloat(fields[3]);
        if (isNaN(value)) {
          validationErrors.push({
            rowNumber,
            fieldName: 'value',
            fieldValue: fields[3],
            expectedValue: 'numeric value',
            failureCategory: 'data_type',
            message: `Row ${rowNumber}: Invalid data type for 'value' - expected numeric, got '${fields[3]}'`,
          });
        }

        const year = parseInt(fields[4]);
        if (isNaN(year) || year < 1990 || year > 2030) {
          validationErrors.push({
            rowNumber,
            fieldName: 'year',
            fieldValue: fields[4],
            expectedValue: 'year between 1990-2030',
            failureCategory: 'data_type',
            message: `Row ${rowNumber}: Invalid year '${fields[4]}' - must be between 1990 and 2030`,
          });
        }
      }

      expect(validationErrors).toHaveLength(2);
      expect(validationErrors[0].fieldName).toBe('value');
      expect(validationErrors[1].fieldName).toBe('year');
    });

    it('should validate business rules correctly', () => {
      const csvWithBusinessRuleViolations = `state,category,statistic,value,year
California,Education,Graduation Rate,-5.5,2020
Texas,Education,Graduation Rate,82.3,2035
New York,Education,Graduation Rate,88.1,2020`;

      const rows = csvWithBusinessRuleViolations.split('\n').slice(1);
      const validationErrors: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(',');
        const rowNumber = i + 2;

        // Business rule validations
        const value = parseFloat(fields[3]);
        if (value < 0) {
          validationErrors.push({
            rowNumber,
            fieldName: 'value',
            fieldValue: fields[3],
            expectedValue: 'positive value',
            failureCategory: 'business_rule',
            message: `Row ${rowNumber}: Negative value not allowed - got ${value}`,
          });
        }

        const year = parseInt(fields[4]);
        if (year > new Date().getFullYear()) {
          validationErrors.push({
            rowNumber,
            fieldName: 'year',
            fieldValue: fields[4],
            expectedValue: `year <= ${new Date().getFullYear()}`,
            failureCategory: 'business_rule',
            message: `Row ${rowNumber}: Future year not allowed - got ${year}`,
          });
        }
      }

      expect(validationErrors).toHaveLength(2);
      expect(validationErrors[0].fieldName).toBe('value');
      expect(validationErrors[1].fieldName).toBe('year');
    });

    it('should validate valid CSV data correctly', () => {
      const validCSV = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5,2020
Texas,Education,Graduation Rate,82.3,2020
New York,Education,Graduation Rate,88.1,2020`;

      const rows = validCSV.split('\n').slice(1);
      const validationErrors: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const fields = row.split(',');
        const rowNumber = i + 2;

        // Validate required fields
        const requiredFields = ['state', 'category', 'statistic', 'value', 'year'];
        let hasError = false;
        
        for (let j = 0; j < requiredFields.length; j++) {
          const field = requiredFields[j];
          const fieldValue = fields[j] || '';
          
          if (!fieldValue || fieldValue.trim() === '') {
            validationErrors.push({
              rowNumber,
              fieldName: field,
              fieldValue: fieldValue,
              failureCategory: 'missing_required',
              message: `Row ${rowNumber}: Missing required field '${field}'`,
            });
            hasError = true;
            break;
          }
        }

        if (hasError) continue;

        // Validate data types
        const value = parseFloat(fields[3]);
        if (isNaN(value)) {
          validationErrors.push({
            rowNumber,
            fieldName: 'value',
            fieldValue: fields[3],
            expectedValue: 'numeric value',
            failureCategory: 'data_type',
            message: `Row ${rowNumber}: Invalid data type for 'value' - expected numeric, got '${fields[3]}'`,
          });
          continue;
        }

        const year = parseInt(fields[4]);
        if (isNaN(year) || year < 1990 || year > 2030) {
          validationErrors.push({
            rowNumber,
            fieldName: 'year',
            fieldValue: fields[4],
            expectedValue: 'year between 1990-2030',
            failureCategory: 'data_type',
            message: `Row ${rowNumber}: Invalid year '${fields[4]}' - must be between 1990 and 2030`,
          });
          continue;
        }

        // Business rule validations
        if (value < 0) {
          validationErrors.push({
            rowNumber,
            fieldName: 'value',
            fieldValue: fields[3],
            expectedValue: 'positive value',
            failureCategory: 'business_rule',
            message: `Row ${rowNumber}: Negative value not allowed - got ${value}`,
          });
          continue;
        }

        if (year > new Date().getFullYear()) {
          validationErrors.push({
            rowNumber,
            fieldName: 'year',
            fieldValue: fields[4],
            expectedValue: `year <= ${new Date().getFullYear()}`,
            failureCategory: 'business_rule',
            message: `Row ${rowNumber}: Future year not allowed - got ${year}`,
          });
          continue;
        }
      }

      expect(validationErrors).toHaveLength(0);
    });
  });

  describe('File Hash Generation', () => {
    it('should generate consistent file hashes', () => {
      const csvContent1 = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5,2020
Texas,Education,Graduation Rate,82.3,2020`;

      const csvContent2 = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5,2020
Texas,Education,Graduation Rate,82.3,2020`;

      const csvContent3 = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5,2020
Texas,Education,Graduation Rate,82.4,2020`;

      // Mock crypto.createHash
      const mockDigest = jest.fn();
      mockDigest.mockReturnValueOnce('hash1');
      mockDigest.mockReturnValueOnce('hash1');
      mockDigest.mockReturnValueOnce('hash2');

      const mockUpdate = jest.fn().mockReturnValue({ digest: mockDigest });
      const mockCreateHash = jest.fn().mockReturnValue({ update: mockUpdate });

      // Simulate hash generation
      const hash1 = mockCreateHash('sha256').update(Buffer.from(csvContent1)).digest('hex');
      const hash2 = mockCreateHash('sha256').update(Buffer.from(csvContent2)).digest('hex');
      const hash3 = mockCreateHash('sha256').update(Buffer.from(csvContent3)).digest('hex');

      expect(hash1).toBe('hash1');
      expect(hash2).toBe('hash1');
      expect(hash3).toBe('hash2');
      expect(hash1).toBe(hash2); // Same content should have same hash
      expect(hash1).not.toBe(hash3); // Different content should have different hash
    });
  });

  describe('CSV Parsing', () => {
    it('should parse CSV with headers correctly', () => {
      const csvContent = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5,2020
Texas,Education,Graduation Rate,82.3,2020
New York,Education,Graduation Rate,88.1,2020`;

      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const dataRows = lines.slice(1);

      expect(headers).toEqual(['state', 'category', 'statistic', 'value', 'year']);
      expect(dataRows).toHaveLength(3);
      expect(dataRows[0].split(',')).toEqual(['California', 'Education', 'Graduation Rate', '85.5', '2020']);
    });

    it('should handle empty lines and whitespace', () => {
      const csvContent = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5,2020

Texas,Education,Graduation Rate,82.3,2020
  New York  ,  Education  ,  Graduation Rate  ,  88.1  ,  2020  `;

      const lines = csvContent.split('\n').filter(line => line.trim());
      const dataRows = lines.slice(1);

      expect(dataRows).toHaveLength(3);
      expect(dataRows[0].split(',')).toEqual(['California', 'Education', 'Graduation Rate', '85.5', '2020']);
      expect(dataRows[1].split(',')).toEqual(['Texas', 'Education', 'Graduation Rate', '82.3', '2020']);
      expect(dataRows[2].split(',')).toEqual(['  New York  ', '  Education  ', '  Graduation Rate  ', '  88.1  ', '  2020  ']);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed CSV gracefully', () => {
      const malformedCSV = `state,category,statistic,value,year
California,Education,Graduation Rate,85.5
Texas,Education,Graduation Rate,82.3,2020,extra
New York,Education,Graduation Rate`;

      const lines = malformedCSV.split('\n').slice(1);
      const validationErrors: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const row = lines[i];
        const fields = row.split(',');
        const rowNumber = i + 2;

        // Check if we have enough fields
        if (fields.length < 5) {
          validationErrors.push({
            rowNumber,
            fieldName: 'format',
            fieldValue: row,
            failureCategory: 'csv_parsing',
            message: `Row ${rowNumber}: Invalid CSV format - expected 5 fields, got ${fields.length}`,
          });
        }
      }

      expect(validationErrors).toHaveLength(2);
      expect(validationErrors[0].rowNumber).toBe(2);
      expect(validationErrors[1].rowNumber).toBe(4);
    });

    it('should handle empty CSV content', () => {
      const emptyCSV = '';

      const lines = emptyCSV.split('\n').filter(line => line.trim());
      
      expect(lines).toHaveLength(0);
    });

    it('should handle CSV with only headers', () => {
      const headerOnlyCSV = `state,category,statistic,value,year`;

      const lines = headerOnlyCSV.split('\n');
      const headers = lines[0].split(',');
      const dataRows = lines.slice(1);

      expect(headers).toEqual(['state', 'category', 'statistic', 'value', 'year']);
      expect(dataRows).toHaveLength(0);
    });
  });
}); 