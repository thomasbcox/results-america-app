import { getDbOrThrow } from '@/lib/db';
import { importLogs, importValidationSummary, csvImports } from '@/lib/db/schema-postgres';
import { eq, and, desc } from 'drizzle-orm';

export interface ValidationError {
  rowNumber: number;
  fieldName?: string;
  fieldValue?: string;
  expectedValue?: string;
  failureCategory: 'missing_required' | 'invalid_reference' | 'data_type' | 'business_rule' | 'database_error' | 'csv_parsing';
  message: string;
  details?: any;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  failureBreakdown: Record<string, number>;
  validationTimeMs: number;
  status: 'validated_failed' | 'validated_passed' | 'imported_success' | 'imported_failed';
}

export interface ImportLog {
  id: number;
  csvImportId: number;
  logLevel: 'info' | 'validation_error' | 'system_error';
  rowNumber?: number;
  fieldName?: string;
  fieldValue?: string;
  expectedValue?: string;
  failureCategory: 'missing_required' | 'invalid_reference' | 'data_type' | 'business_rule' | 'database_error' | 'csv_parsing';
  message: string;
  details?: string;
  timestamp: Date;
}

export class ImportLoggingService {
  static async logValidationError(
    importId: number, 
    error: ValidationError
  ): Promise<void> {
    const db = getDbOrThrow();
    await db.insert(importLogs).values({
      csvImportId: importId,
      logLevel: 'validation_error',
      rowNumber: error.rowNumber,
      fieldName: error.fieldName,
      fieldValue: error.fieldValue,
      expectedValue: error.expectedValue,
      failureCategory: error.failureCategory,
      message: error.message,
      details: error.details ? JSON.stringify(error.details) : null,
    });
  }

  static async logSystemError(
    importId: number, 
    error: Error, 
    details?: any
  ): Promise<void> {
    const db = getDbOrThrow();
    await db.insert(importLogs).values({
      csvImportId: importId,
      logLevel: 'system_error',
      message: error.message,
      details: details ? JSON.stringify(details) : null,
      failureCategory: 'database_error',
    });
  }

  static async logInfo(
    importId: number, 
    message: string, 
    details?: any
  ): Promise<void> {
    const db = getDbOrThrow();
    await db.insert(importLogs).values({
      csvImportId: importId,
      logLevel: 'info',
      message,
      details: details ? JSON.stringify(details) : null,
      failureCategory: 'database_error', // Default for info logs
    });
  }

  static async createValidationSummary(
    importId: number, 
    summary: ValidationSummary
  ): Promise<void> {
    const db = getDbOrThrow();
    await db.insert(importValidationSummary).values({
      csvImportId: importId,
      totalRows: summary.totalRows,
      validRows: summary.validRows,
      errorRows: summary.errorRows,
      failureBreakdown: JSON.stringify(summary.failureBreakdown),
      validationTimeMs: summary.validationTimeMs,
      status: summary.status,
    });
  }

  static async getImportLogs(importId: number): Promise<ImportLog[]> {
    const db = getDbOrThrow();
    const logs = await db
      .select()
      .from(importLogs)
      .where(eq(importLogs.csvImportId, importId))
      .orderBy(desc(importLogs.timestamp));

    return logs.map((log: any) => ({
      ...log,
      timestamp: new Date(log.timestamp),
      details: log.details ? JSON.parse(log.details) : undefined,
    }));
  }

  static async getImportSummary(importId: number): Promise<ValidationSummary | null> {
    const db = getDbOrThrow();
    const summary = await db
      .select()
      .from(importValidationSummary)
      .where(eq(importValidationSummary.csvImportId, importId))
      .limit(1);

    if (summary.length === 0) return null;

    const result = summary[0];
    return {
      totalRows: result.totalRows,
      validRows: result.validRows,
      errorRows: result.errorRows,
      failureBreakdown: result.failureBreakdown ? JSON.parse(result.failureBreakdown) : {},
      validationTimeMs: result.validationTimeMs || 0,
      status: result.status,
    };
  }

  static async getFailedRowsCSV(importId: number): Promise<string> {
    const logs = await this.getImportLogs(importId);
    const validationErrors = logs.filter(log => log.logLevel === 'validation_error');
    
    if (validationErrors.length === 0) {
      return '';
    }

    // Create CSV with failed rows
    const csvHeader = 'Row Number,Field Name,Field Value,Expected Value,Failure Category,Message\n';
    const csvRows = validationErrors.map(log => 
      `${log.rowNumber || ''},"${log.fieldName || ''}","${log.fieldValue || ''}","${log.expectedValue || ''}","${log.failureCategory}","${log.message}"`
    ).join('\n');

    return csvHeader + csvRows;
  }

  static async updateImportStatus(
    importId: number, 
    status: 'uploaded' | 'validating' | 'validation_failed' | 'importing' | 'imported' | 'failed',
    errorMessage?: string
  ): Promise<void> {
    const db = getDbOrThrow();
    await db
      .update(csvImports)
      .set({ 
        status, 
        errorMessage
      })
      .where(eq(csvImports.id, importId));
  }
} 