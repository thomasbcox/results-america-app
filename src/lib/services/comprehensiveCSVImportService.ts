import { getDb } from '@/lib/db';
import { csvImports, states, categories, statistics, dataPoints, importSessions, dataSources } from '@/lib/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { parse } from 'csv-parse/sync';
import { createHash } from 'crypto';
import { ImportLoggingService, ValidationError, ValidationSummary } from './importLoggingService';

export interface CSVImportResult {
  success: boolean;
  importId: number;
  message: string;
  stats: {
    totalRows: number;
    validRows: number;
    errorRows: number;
  };
  summary?: {
    failureBreakdown: Record<string, number>;
    processingTime: string;
  };
}

export class ComprehensiveCSVImportService {
  static async importCSV(
    userId: number,
    fileName: string,
    fileBuffer: Buffer,
    templateId?: number
  ): Promise<CSVImportResult> {
    const db = getDb();
    const startTime = Date.now();
    const fileHash = createHash('sha256').update(fileBuffer).digest('hex');
    const fileSize = fileBuffer.length;

    // Check for duplicate file
    const existingImport = await db
      .select()
      .from(csvImports)
      .where(eq(csvImports.fileHash, fileHash))
      .limit(1);

    if (existingImport.length > 0) {
      return {
        success: false,
        importId: existingImport[0].id,
        message: 'This file has already been imported',
        stats: { totalRows: 0, validRows: 0, errorRows: 0 }
      };
    }

    // Create import record
    const [importRecord] = await db
      .insert(csvImports)
      .values({
        name: fileName,
        filename: fileName,
        fileSize,
        fileHash,
        uploadedBy: userId,
        status: 'validating',
      })
      .returning();

    const importId = importRecord.id;

    try {
      // Parse CSV
      const csvContent = fileBuffer.toString('utf-8');
      const rows = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      await ImportLoggingService.logInfo(importId, `CSV parsed successfully - ${rows.length} rows found`);

      // Phase 1: Full Validation (No Database Writes)
      const validationErrors: ValidationError[] = [];
      const validRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i] as Record<string, any>;
        const rowNumber = i + 2; // +2 because CSV is 1-indexed and we skip header

        // Validate required fields
        const requiredFields = ['state', 'category', 'statistic', 'value', 'year'];
        for (const field of requiredFields) {
          if (!row[field] || row[field].toString().trim() === '') {
            validationErrors.push({
              rowNumber,
              fieldName: field,
              fieldValue: row[field] || '',
              failureCategory: 'missing_required',
              message: `Row ${rowNumber}: Missing required field '${field}'`,
            });
            break; // Skip to next row if any required field is missing
          }
        }

        if (validationErrors.some(e => e.rowNumber === rowNumber)) {
          continue; // Skip further validation for this row
        }

        // Validate data types
        const value = parseFloat(row.value);
        if (isNaN(value)) {
          validationErrors.push({
            rowNumber,
            fieldName: 'value',
            fieldValue: row.value,
            expectedValue: 'numeric value',
            failureCategory: 'data_type',
            message: `Row ${rowNumber}: Invalid data type for 'value' - expected numeric, got '${row.value}'`,
          });
          continue;
        }

        const year = parseInt(row.year);
        if (isNaN(year) || year < 1990 || year > 2030) {
          validationErrors.push({
            rowNumber,
            fieldName: 'year',
            fieldValue: row.year,
            expectedValue: 'year between 1990-2030',
            failureCategory: 'data_type',
            message: `Row ${rowNumber}: Invalid year '${row.year}' - must be between 1990 and 2030`,
          });
          continue;
        }

        // Business rule validations
        if (value < 0) {
          validationErrors.push({
            rowNumber,
            fieldName: 'value',
            fieldValue: row.value,
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
            fieldValue: row.year,
            expectedValue: `year <= ${new Date().getFullYear()}`,
            failureCategory: 'business_rule',
            message: `Row ${rowNumber}: Future year not allowed - got ${year}`,
          });
          continue;
        }

        // If we get here, the row is valid for now
        validRows.push({
          rowNumber,
          state: row.state.trim(),
          category: row.category.trim(),
          statistic: row.statistic.trim(),
          value,
          year,
        });
      }

      // Validate references (states, categories, statistics)
      const stateNames = [...new Set(validRows.map(r => r.state))];
      const categoryNames = [...new Set(validRows.map(r => r.category))];
      const statisticNames = [...new Set(validRows.map(r => r.statistic))];

      const [dbStates, dbCategories, dbStatistics, dbDataSources] = await Promise.all([
        db.select().from(states).where(inArray(states.name, stateNames)),
        db.select().from(categories).where(inArray(categories.name, categoryNames)),
        db.select().from(statistics).where(inArray(statistics.name, statisticNames)),
        db.select().from(dataSources),
      ]);

      const validStateNames = new Set(dbStates.map((s: any) => s.name));
      const validCategoryNames = new Set(dbCategories.map((c: any) => c.name));
      const validStatisticNames = new Set(dbStatistics.map((s: any) => s.name));
      
      // Create data source map for statistics
      const dataSourceMap = new Map();
      for (const stat of dbStatistics) {
        if (stat.dataSourceId) {
          const dataSource = dbDataSources.find((ds: any) => ds.id === stat.dataSourceId);
          if (dataSource) {
            dataSourceMap.set(stat.name, dataSource.id);
          }
        }
      }

      // Check for invalid references
      for (const row of validRows) {
        if (!validStateNames.has(row.state)) {
          validationErrors.push({
            rowNumber: row.rowNumber,
            fieldName: 'state',
            fieldValue: row.state,
            failureCategory: 'invalid_reference',
            message: `Row ${row.rowNumber}: Invalid state '${row.state}' - not found in database`,
          });
        }

        if (!validCategoryNames.has(row.category)) {
          validationErrors.push({
            rowNumber: row.rowNumber,
            fieldName: 'category',
            fieldValue: row.category,
            failureCategory: 'invalid_reference',
            message: `Row ${row.rowNumber}: Invalid category '${row.category}' - not found in database`,
          });
        }

        if (!validStatisticNames.has(row.statistic)) {
          validationErrors.push({
            rowNumber: row.rowNumber,
            fieldName: 'statistic',
            fieldValue: row.statistic,
            failureCategory: 'invalid_reference',
            message: `Row ${row.rowNumber}: Invalid statistic '${row.statistic}' - not found in database`,
          });
        }
      }

      // Log all validation errors
      for (const error of validationErrors) {
        await ImportLoggingService.logValidationError(importId, error);
      }

      // Create validation summary
      const failureBreakdown = validationErrors.reduce((acc, error) => {
        acc[error.failureCategory] = (acc[error.failureCategory] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const validationSummary: ValidationSummary = {
        totalRows: rows.length,
        validRows: rows.length - validationErrors.length,
        errorRows: validationErrors.length,
        failureBreakdown,
        validationTimeMs: Date.now() - startTime,
        status: validationErrors.length > 0 ? 'validated_failed' : 'validated_passed',
      };

      await ImportLoggingService.createValidationSummary(importId, validationSummary);

      // Update import status
      if (validationErrors.length > 0) {
        await ImportLoggingService.updateImportStatus(importId, 'validation_failed', 
          `Validation failed - ${validationErrors.length} errors found`);
        
        return {
          success: false,
          importId,
          message: `Import failed validation - ${validationErrors.length} rows have errors`,
          stats: {
            totalRows: rows.length,
            validRows: rows.length - validationErrors.length,
            errorRows: validationErrors.length,
          },
          summary: {
            failureBreakdown,
            processingTime: `${validationSummary.validationTimeMs}ms`,
          }
        };
      }

      // Phase 2: All-or-Nothing Import
      await ImportLoggingService.updateImportStatus(importId, 'importing');
      await ImportLoggingService.logInfo(importId, 'Starting database import');

      const importStartTime = Date.now();

      // Create lookup maps for efficient reference resolution
      const stateMap = new Map(dbStates.map((s: any) => [s.name, s.id]));
      const categoryMap = new Map(dbCategories.map((c: any) => [c.name, c.id]));
      const statisticMap = new Map(dbStatistics.map((s: any) => [s.name, s.id]));

      // Prepare data points for insertion
      const dataPointsToInsert = validRows.map(row => ({
        stateId: stateMap.get(row.state)!,
        categoryId: categoryMap.get(row.category)!,
        statisticId: statisticMap.get(row.statistic)!,
        value: row.value,
        year: row.year,
      }));

      // Create an import session for this import
      const [importSession] = await db
        .insert(importSessions)
        .values({
          name: `CSV Import - ${fileName}`,
          description: `Import from file: ${fileName}`,
          dataSourceId: dataSourceMap.get(validRows[0].statistic) || null,
          dataYear: validRows[0].year,
          recordCount: dataPointsToInsert.length,
          isActive: 1,
        })
        .returning();

      // Update data points with import session ID
      const dataPointsWithSession = dataPointsToInsert.map(dp => ({
        ...dp,
        importSessionId: importSession.id,
      }));

      // Insert all data points in a single transaction
      await db.insert(dataPoints).values(dataPointsWithSession);

      const importTime = Date.now() - importStartTime;
      await ImportLoggingService.logInfo(importId, `Import completed successfully - ${dataPointsToInsert.length} rows imported in ${importTime}ms`);

      // Update final status
      await ImportLoggingService.updateImportStatus(importId, 'imported');
      await ImportLoggingService.createValidationSummary(importId, {
        ...validationSummary,
        status: 'imported_success',
        validationTimeMs: Date.now() - startTime,
      });

      return {
        success: true,
        importId,
        message: `Successfully imported all ${dataPointsToInsert.length} rows`,
        stats: {
          totalRows: rows.length,
          validRows: dataPointsToInsert.length,
          errorRows: 0,
        },
        summary: {
          failureBreakdown: {},
          processingTime: `${Date.now() - startTime}ms`,
        }
      };

    } catch (error) {
      await ImportLoggingService.logSystemError(importId, error as Error, { fileName, fileSize });
      await ImportLoggingService.updateImportStatus(importId, 'failed', (error as Error).message);

      return {
        success: false,
        importId,
        message: `Import failed: ${(error as Error).message}`,
        stats: { totalRows: 0, validRows: 0, errorRows: 0 }
      };
    }
  }

  static async getImportDetails(importId: number) {
    const db = getDb();
    const [importRecord] = await db
      .select()
      .from(csvImports)
      .where(eq(csvImports.id, importId));

    if (!importRecord) {
      throw new Error('Import not found');
    }

    const logs = await ImportLoggingService.getImportLogs(importId);
    const summary = await ImportLoggingService.getImportSummary(importId);

    return {
      import: importRecord,
      logs,
      summary,
    };
  }
} 