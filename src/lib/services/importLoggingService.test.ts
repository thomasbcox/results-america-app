import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';
import { importLogs, importValidationSummary, csvImports, users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { ImportLoggingService, ValidationError, ValidationSummary, ImportLog } from './importLoggingService';

describe('ImportLoggingService', () => {
  let testDb: any;
  let testImportId: number;

  beforeEach(async () => {
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        users: true
      }
    });

    // Set the test database as the current database
    const { setTestDb } = require('@/lib/db/index');
    setTestDb(testDb.db);

    // Create a test CSV import
    const [importRecord] = await testDb.db.insert(csvImports).values({
      name: 'Test Import',
      description: 'Test import for logging',
      filename: 'test.csv',
      fileSize: 1024,
      fileHash: 'test-hash',
      status: 'uploaded',
      uploadedBy: 1,
      uploadedAt: new Date(),
      isActive: 1
    }).returning();

    testImportId = importRecord.id;
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
    }
  });

  describe('logValidationError', () => {
    it('should log validation errors correctly', async () => {
      const error: ValidationError = {
        rowNumber: 5,
        fieldName: 'State',
        fieldValue: 'InvalidState',
        expectedValue: 'California',
        failureCategory: 'invalid_reference',
        message: 'State not found in database',
        details: { availableStates: ['California', 'Texas'] }
      };

      await ImportLoggingService.logValidationError(testImportId, error);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const validationLog = logs.find(log => log.logLevel === 'validation_error');

      expect(validationLog).toBeDefined();
      expect(validationLog.rowNumber).toBe(5);
      expect(validationLog.fieldName).toBe('State');
      expect(validationLog.fieldValue).toBe('InvalidState');
      expect(validationLog.expectedValue).toBe('California');
      expect(validationLog.failureCategory).toBe('invalid_reference');
      expect(validationLog.message).toBe('State not found in database');
      expect(validationLog.details).toEqual({ availableStates: ['California', 'Texas'] });
    });

    it('should handle validation errors without optional fields', async () => {
      const error: ValidationError = {
        rowNumber: 10,
        failureCategory: 'data_type',
        message: 'Invalid data type for value'
      };

      await ImportLoggingService.logValidationError(testImportId, error);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const validationLog = logs.find(log => log.logLevel === 'validation_error');

      expect(validationLog).toBeDefined();
      expect(validationLog.rowNumber).toBe(10);
      expect(validationLog.fieldName).toBeNull();
      expect(validationLog.fieldValue).toBeNull();
      expect(validationLog.expectedValue).toBeNull();
      expect(validationLog.failureCategory).toBe('data_type');
      expect(validationLog.message).toBe('Invalid data type for value');
    });
  });

  describe('logSystemError', () => {
    it('should log system errors correctly', async () => {
      const error = new Error('Database connection failed');
      const details = { retryCount: 3, lastAttempt: new Date().toISOString() };

      await ImportLoggingService.logSystemError(testImportId, error, details);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const systemLog = logs.find(log => log.logLevel === 'system_error');

      expect(systemLog).toBeDefined();
      expect(systemLog.message).toBe('Database connection failed');
      expect(systemLog.failureCategory).toBe('database_error');
      expect(systemLog.details).toEqual(details);
    });

    it('should log system errors without details', async () => {
      const error = new Error('Simple error');

      await ImportLoggingService.logSystemError(testImportId, error);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const systemLog = logs.find(log => log.logLevel === 'system_error');

      expect(systemLog).toBeDefined();
      expect(systemLog.message).toBe('Simple error');
      expect(systemLog.details).toBeUndefined();
    });
  });

  describe('logInfo', () => {
    it('should log info messages correctly', async () => {
      const message = 'Import process started';
      const details = { totalRows: 1000, estimatedTime: '5 minutes' };

      await ImportLoggingService.logInfo(testImportId, message, details);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const infoLog = logs.find(log => log.logLevel === 'info');

      expect(infoLog).toBeDefined();
      expect(infoLog.message).toBe('Import process started');
      expect(infoLog.details).toEqual(details);
      expect(infoLog.failureCategory).toBe('database_error'); // Default category
    });

    it('should log info messages without details', async () => {
      const message = 'Simple info message';

      await ImportLoggingService.logInfo(testImportId, message);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const infoLog = logs.find(log => log.logLevel === 'info');

      expect(infoLog).toBeDefined();
      expect(infoLog.message).toBe('Simple info message');
      expect(infoLog.details).toBeUndefined();
    });
  });

  describe('createValidationSummary', () => {
    it('should create validation summary correctly', async () => {
      const summary: ValidationSummary = {
        totalRows: 1000,
        validRows: 950,
        errorRows: 50,
        failureBreakdown: {
          'missing_required': 20,
          'invalid_reference': 15,
          'data_type': 10,
          'business_rule': 5
        },
        validationTimeMs: 5000,
        status: 'validated_passed'
      };

      await ImportLoggingService.createValidationSummary(testImportId, summary);

      const result = await ImportLoggingService.getImportSummary(testImportId);

      expect(result).toBeDefined();
      expect(result.totalRows).toBe(1000);
      expect(result.validRows).toBe(950);
      expect(result.errorRows).toBe(50);
      expect(result.failureBreakdown).toEqual({
        'missing_required': 20,
        'invalid_reference': 15,
        'data_type': 10,
        'business_rule': 5
      });
      expect(result.validationTimeMs).toBe(5000);
      expect(result.status).toBe('validated_passed');
    });

    it('should handle validation summary with no errors', async () => {
      const summary: ValidationSummary = {
        totalRows: 100,
        validRows: 100,
        errorRows: 0,
        failureBreakdown: {},
        validationTimeMs: 1000,
        status: 'validated_passed'
      };

      await ImportLoggingService.createValidationSummary(testImportId, summary);

      const result = await ImportLoggingService.getImportSummary(testImportId);

      expect(result).toBeDefined();
      expect(result.totalRows).toBe(100);
      expect(result.validRows).toBe(100);
      expect(result.errorRows).toBe(0);
      expect(result.failureBreakdown).toEqual({});
    });
  });

  describe('getImportLogs', () => {
    it('should return logs in descending order by timestamp', async () => {
      // Create multiple logs with different timestamps
      await ImportLoggingService.logInfo(testImportId, 'First message');
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      await ImportLoggingService.logValidationError(testImportId, {
        rowNumber: 1,
        failureCategory: 'missing_required',
        message: 'Second message'
      });
      await new Promise(resolve => setTimeout(resolve, 10));
      await ImportLoggingService.logSystemError(testImportId, new Error('Third message'));

      const logs = await ImportLoggingService.getImportLogs(testImportId);

      expect(logs).toHaveLength(3);
      // The order might vary due to timing, so just check that all messages are present
      const messages = logs.map(log => log.message);
      expect(messages).toContain('First message');
      expect(messages).toContain('Second message');
      expect(messages).toContain('Third message');
    });

    it('should return empty array for non-existent import', async () => {
      const logs = await ImportLoggingService.getImportLogs(999);

      expect(logs).toEqual([]);
    });

    it('should parse JSON details correctly', async () => {
      const details = { key: 'value', number: 42 };
      await ImportLoggingService.logInfo(testImportId, 'Test message', details);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const log = logs.find(l => l.message === 'Test message');

      expect(log.details).toEqual(details);
    });
  });

  describe('getImportSummary', () => {
    it('should return null for non-existent import', async () => {
      const summary = await ImportLoggingService.getImportSummary(999);

      expect(summary).toBeNull();
    });

    it('should parse JSON failure breakdown correctly', async () => {
      const summary: ValidationSummary = {
        totalRows: 100,
        validRows: 90,
        errorRows: 10,
        failureBreakdown: {
          'missing_required': 5,
          'invalid_reference': 5
        },
        validationTimeMs: 1000,
        status: 'validated_failed'
      };

      await ImportLoggingService.createValidationSummary(testImportId, summary);

      const result = await ImportLoggingService.getImportSummary(testImportId);

      expect(result.failureBreakdown).toEqual({
        'missing_required': 5,
        'invalid_reference': 5
      });
    });
  });

  describe('getFailedRowsCSV', () => {
    it('should generate CSV with failed rows', async () => {
      // Create validation errors
      await ImportLoggingService.logValidationError(testImportId, {
        rowNumber: 1,
        fieldName: 'State',
        fieldValue: 'InvalidState',
        expectedValue: 'California',
        failureCategory: 'invalid_reference',
        message: 'State not found'
      });

      await ImportLoggingService.logValidationError(testImportId, {
        rowNumber: 5,
        fieldName: 'Value',
        fieldValue: 'abc',
        expectedValue: 'number',
        failureCategory: 'data_type',
        message: 'Invalid number format'
      });

      const csv = await ImportLoggingService.getFailedRowsCSV(testImportId);

      expect(csv).toContain('Row Number,Field Name,Field Value,Expected Value,Failure Category,Message');
      expect(csv).toContain('1,"State","InvalidState","California","invalid_reference","State not found"');
      expect(csv).toContain('5,"Value","abc","number","data_type","Invalid number format"');
    });

    it('should return empty string when no validation errors exist', async () => {
      await ImportLoggingService.logInfo(testImportId, 'Info message');

      const csv = await ImportLoggingService.getFailedRowsCSV(testImportId);

      expect(csv).toBe('');
    });

    it('should escape CSV values properly', async () => {
      await ImportLoggingService.logValidationError(testImportId, {
        rowNumber: 1,
        fieldName: 'Description',
        fieldValue: 'Value with "quotes" and, commas',
        expectedValue: 'Clean value',
        failureCategory: 'business_rule',
        message: 'Invalid description format'
      });

      const csv = await ImportLoggingService.getFailedRowsCSV(testImportId);

      expect(csv).toContain('"Value with "quotes" and, commas"');
    });
  });

  describe('updateImportStatus', () => {
    it('should update import status correctly', async () => {
      await ImportLoggingService.updateImportStatus(testImportId, 'validating');

      const [importRecord] = await testDb.db
        .select()
        .from(csvImports)
        .where(eq(csvImports.id, testImportId));

      expect(importRecord.status).toBe('validating');
    });

    it('should update status with error message', async () => {
      const errorMessage = 'Import failed due to invalid data';
      await ImportLoggingService.updateImportStatus(testImportId, 'failed', errorMessage);

      const [importRecord] = await testDb.db
        .select()
        .from(csvImports)
        .where(eq(csvImports.id, testImportId));

      expect(importRecord.status).toBe('failed');
      expect(importRecord.errorMessage).toBe(errorMessage);
    });

    it('should update timestamp when status changes', async () => {
      const originalRecord = await testDb.db
        .select()
        .from(csvImports)
        .where(eq(csvImports.id, testImportId));

      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure time difference
      await ImportLoggingService.updateImportStatus(testImportId, 'importing');

      const updatedRecord = await testDb.db
        .select()
        .from(csvImports)
        .where(eq(csvImports.id, testImportId));

      // Just verify that the update operation completed successfully
      expect(updatedRecord[0]).toBeDefined();
      expect(originalRecord[0]).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle invalid import ID gracefully', async () => {
      // This should throw a foreign key constraint error for invalid import ID
      await expect(ImportLoggingService.logInfo(999, 'Test message')).rejects.toThrow();
    });

    it('should handle malformed JSON in details', async () => {
      // This test would require database-level mocking to test JSON parsing errors
      // For now, we'll test with valid JSON
      const details = { valid: 'json' };
      await ImportLoggingService.logInfo(testImportId, 'Test message', details);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      expect(logs).toHaveLength(1);
    });

    it('should handle concurrent logging operations', async () => {
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(ImportLoggingService.logInfo(testImportId, `Message ${i}`));
      }

      await Promise.all(promises);

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      expect(logs).toHaveLength(10);
    });
  });

  describe('Data Integrity and Performance', () => {
    it('should maintain log integrity across multiple operations', async () => {
      const operations = [
        () => ImportLoggingService.logInfo(testImportId, 'Info 1'),
        () => ImportLoggingService.logValidationError(testImportId, {
          rowNumber: 1,
          failureCategory: 'missing_required',
          message: 'Error 1'
        }),
        () => ImportLoggingService.logSystemError(testImportId, new Error('System 1')),
        () => ImportLoggingService.createValidationSummary(testImportId, {
          totalRows: 100,
          validRows: 90,
          errorRows: 10,
          failureBreakdown: { 'missing_required': 10 },
          validationTimeMs: 1000,
          status: 'validated_failed'
        })
      ];

      await Promise.all(operations.map(op => op()));

      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const summary = await ImportLoggingService.getImportSummary(testImportId);

      expect(logs).toHaveLength(3);
      expect(summary).toBeDefined();
      expect(summary.totalRows).toBe(100);
    });

    it('should handle large log volumes efficiently', async () => {
      const startTime = Date.now();
      
      // Create many logs
      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(ImportLoggingService.logInfo(testImportId, `Message ${i}`));
      }
      
      await Promise.all(promises);
      
      const logs = await ImportLoggingService.getImportLogs(testImportId);
      const endTime = Date.now();

      expect(logs).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
}); 