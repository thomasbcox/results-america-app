import { getDb } from '../db/index';
import { 
  csvImports, 
  csvImportMetadata, 
  csvImportStaging, 
  csvImportTemplates,
  dataPoints,
  importSessions,
  states,
  statistics,
  categories,
  dataSources,
  users
} from '../db/schema-postgres';
import { eq, and, desc } from 'drizzle-orm';
import { createHash } from 'crypto';
import { parse } from 'csv-parse/sync';

export interface ImportSession {
  id: number;
  fileName: string;
  fileHash: string;
  uploadedBy: number;
  uploadedAt: Date;
  templateId: number;
  status: 'uploaded' | 'validating' | 'staged' | 'failed' | 'published' | 'rolled_back';
  validationSummary?: ValidationSummary;
  errorLog?: ValidationError[];
  promotionHistory?: PromotionRecord[];
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  errorRows: number;
  warnings: number;
  failureBreakdown: Record<string, number>;
  validationTimeMs: number;
}

export interface ValidationError {
  rowNumber: number;
  fieldName?: string;
  fieldValue?: string;
  expectedValue?: string;
  failureCategory: 'missing_required' | 'invalid_reference' | 'data_type' | 'business_rule' | 'database_error' | 'csv_parsing';
  message: string;
  details?: any;
}

export interface PromotionRecord {
  id: number;
  importSessionId: number;
  promotedBy: number;
  promotedAt: Date;
  rollbackSessionId?: number;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  canRetry: boolean;
  reason?: string;
  originalSession?: ImportSession;
}

export interface CSVImportResult {
  success: boolean;
  importId?: number;
  message: string;
  errors?: string[];
  warnings?: string[];
  stats?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warnings: number;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
  stats: ValidationSummary;
}

export interface PromotionResult {
  success: boolean;
  message: string;
  publishedRows: number;
  rollbackSessionId?: number;
}

export interface RollbackResult {
  success: boolean;
  message: string;
  rolledBackRows: number;
}

export class UnifiedCSVImportService {
  /**
   * Upload and stage a CSV file for import
   */
  static async uploadAndStage(
    file: File,
    templateId: number,
    metadata: Record<string, any>,
    userId: number
  ): Promise<CSVImportResult> {
    const db = getDb();
    try {
      console.log('UnifiedCSVImportService.uploadAndStage started');
      
      // Read and parse the file
      const fileBuffer = await file.arrayBuffer();
      let fileContent = new TextDecoder().decode(fileBuffer);
      
      // Preprocess CSV content
      fileContent = fileContent.replace(/^\uFEFF/, ''); // Remove BOM
      fileContent = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      fileContent = fileContent.split('\n').filter(line => line.trim()).join('\n');
      
      const fileHash = createHash('sha256').update(fileContent).digest('hex');
      
      // Smart duplicate check with retry logic
      const duplicateCheck = await this.checkDuplicateFile(fileHash);
      if (duplicateCheck.isDuplicate && !duplicateCheck.canRetry) {
        return {
          success: false,
          message: duplicateCheck.reason || 'Duplicate file detected',
          errors: ['File already successfully imported']
        };
      }

      // Get template
      const template = await this.getTemplate(templateId);
      if (!template) {
        return {
          success: false,
          message: 'Invalid template',
          errors: ['Template not found']
        };
      }

      // Parse CSV
      let records;
      try {
        records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true,
          relax_column_count: true,
          relax_quotes: true,
          skip_records_with_error: true
        });
      } catch (parseError) {
        return {
          success: false,
          message: 'CSV parsing failed',
          errors: [`CSV parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`]
        };
      }

      // Create import record
      const [importRecord] = await db.insert(csvImports).values({
        name: metadata.name || `Import from ${file.name}`,
        description: metadata.description,
        filename: file.name,
        fileSize: file.size,
        fileHash,
        status: 'uploaded',
        uploadedBy: userId,
        metadata: JSON.stringify(metadata)
      }).returning();

      // Store metadata
      for (const [key, value] of Object.entries(metadata)) {
        await db.insert(csvImportMetadata).values({
          csvImportId: importRecord.id,
          key,
          value: String(value),
          dataType: 'string',
          isRequired: 0
        });
      }

      // Stage the data
      const stagingResult = await this.stageData(importRecord.id, records, template);
      
      // Update import status
      await db.update(csvImports)
        .set({ status: 'staged' })
        .where(eq(csvImports.id, importRecord.id));

      return {
        success: true,
        importId: importRecord.id,
        message: `Successfully uploaded and staged ${stagingResult.stats.totalRows} rows`,
        stats: stagingResult.stats
      };

    } catch (error) {
      console.error('UnifiedCSVImportService.uploadAndStage error:', error);
      return {
        success: false,
        message: 'Upload failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Validate staged data
   */
  static async validateStagedData(sessionId: number): Promise<ValidationResult> {
    const db = getDb();
    console.log(`🔍 Starting validation for import ${sessionId}`);
    
    const stagedData = await db.select()
      .from(csvImportStaging)
      .where(eq(csvImportStaging.csvImportId, sessionId))
      .orderBy(csvImportStaging.rowNumber);

    console.log(`📊 Found ${stagedData.length} staged rows to validate`);

    const errors: ValidationError[] = [];
    const warnings: string[] = [];
    let validRows = 0;
    let invalidRows = 0;
    let warningCount = 0;

    // Business rule validations
    for (let i = 0; i < stagedData.length; i++) {
      const row = stagedData[i];
      const rowErrors: ValidationError[] = [];
      const rowWarnings: string[] = [];

      // Progress logging every 50 rows
      if (i % 50 === 0) {
        console.log(`⏳ Validating row ${i + 1}/${stagedData.length}`);
      }

      // Check state exists
      if (row.stateName && !row.stateId) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          fieldName: 'state',
          fieldValue: row.stateName,
          failureCategory: 'invalid_reference',
          message: `State "${row.stateName}" not found in database`
        });
      }

      // Check statistic exists
      if (row.statisticName && !row.statisticId) {
        rowErrors.push({
          rowNumber: row.rowNumber,
          fieldName: 'statistic',
          fieldValue: row.statisticName,
          failureCategory: 'invalid_reference',
          message: `Statistic "${row.statisticName}" not found in database`
        });
      }

      // Check for duplicate data - warning, not error
      if (row.stateId && row.statisticId && row.year) {
        const existingData = await db.select()
          .from(dataPoints)
          .where(and(
            eq(dataPoints.stateId, row.stateId),
            eq(dataPoints.statisticId, row.statisticId),
            eq(dataPoints.year, row.year)
          ));

        if (existingData.length > 0) {
          rowWarnings.push(`Data already exists for this state/statistic/year combination`);
        }
      }

      // Check value range
      if (row.value !== null && row.value !== undefined) {
        if (row.value < 0) {
          rowWarnings.push(`Negative value detected: ${row.value}`);
        }
        if (row.value > 1000000000) {
          rowWarnings.push(`Unusually large value detected: ${row.value}`);
        }
      }

      if (rowErrors.length > 0) {
        invalidRows++;
        errors.push(...rowErrors);
      } else {
        validRows++;
      }

      warnings.push(...rowWarnings.map(w => `Row ${row.rowNumber}: ${w}`));
      warningCount += rowWarnings.length;
    }

    console.log(`✅ Validation complete: ${validRows} valid, ${invalidRows} invalid, ${warningCount} warnings`);

    // Create validation summary
    const failureBreakdown = errors.reduce((acc, error) => {
      acc[error.failureCategory] = (acc[error.failureCategory] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const validationSummary: ValidationSummary = {
      totalRows: stagedData.length,
      validRows,
      errorRows: invalidRows,
      warnings: warningCount,
      failureBreakdown,
      validationTimeMs: Date.now() - Date.now() // Will be calculated properly
    };

    // Update validation status - only fail if there are actual errors, not warnings
    const finalStatus = errors.length > 0 ? 'validation_failed' : 'validated';
    console.log(`📝 Setting import status to: ${finalStatus}`);
    
    await db.update(csvImports)
      .set({ 
        status: finalStatus,
        validatedAt: new Date(),
        errorMessage: errors.length > 0 ? errors.slice(0, 5).map(e => e.message).join('; ') : null
      })
      .where(eq(csvImports.id, sessionId));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: validationSummary
    };
  }

  /**
   * Promote staged data to production
   */
  static async promoteToProduction(sessionId: number, userId: number): Promise<PromotionResult> {
    const db = getDb();
    try {
      // Get import details
      const [importRecord] = await db.select()
        .from(csvImports)
        .where(eq(csvImports.id, sessionId));

      if (!importRecord) {
        return { success: false, message: 'Import not found', publishedRows: 0 };
      }

      if (importRecord.status !== 'validated') {
        return { success: false, message: 'Import must be validated before publishing', publishedRows: 0 };
      }

      // Get valid staged data
      const stagedData = await db.select()
        .from(csvImportStaging)
        .where(and(
          eq(csvImportStaging.csvImportId, sessionId),
          eq(csvImportStaging.validationStatus, 'valid')
        ));

      if (stagedData.length === 0) {
        return { success: false, message: 'No valid data to publish', publishedRows: 0 };
      }

      // Create import session for production data
      const [importSession] = await db.insert(importSessions).values({
        name: importRecord.name,
        description: importRecord.description,
        dataYear: new Date().getFullYear(),
        recordCount: stagedData.length,
        isActive: 1
      }).returning();

      // Prepare data points with versioning
      const dataPointsToInsert = stagedData
        .filter((row: any) => row.stateId && row.statisticId && row.value !== null)
        .map((row: any) => ({
          importSessionId: importSession.id,
          year: row.year || new Date().getFullYear(),
          stateId: row.stateId!,
          statisticId: row.statisticId!,
          value: row.value!
        }));

      // Insert data points
      if (dataPointsToInsert.length > 0) {
        await db.insert(dataPoints).values(dataPointsToInsert);
      }

      // Mark staged rows as processed
      await db.update(csvImportStaging)
        .set({ 
          isProcessed: 1,
          processedAt: new Date()
        })
        .where(eq(csvImportStaging.csvImportId, sessionId));

      // Update import status
      await db.update(csvImports)
        .set({ 
          status: 'published',
          publishedAt: new Date()
        })
        .where(eq(csvImports.id, sessionId));

      return {
        success: true,
        message: `Successfully published ${dataPointsToInsert.length} data points`,
        publishedRows: dataPointsToInsert.length
      };

    } catch (error) {
      return {
        success: false,
        message: 'Publishing failed',
        publishedRows: 0
      };
    }
  }

  /**
   * Rollback a promotion
   */
  static async rollbackPromotion(sessionId: number, userId: number): Promise<RollbackResult> {
    const db = getDb();
    try {
      // Get import details
      const [importRecord] = await db.select()
        .from(csvImports)
        .where(eq(csvImports.id, sessionId));

      if (!importRecord) {
        return { success: false, message: 'Import not found', rolledBackRows: 0 };
      }

      if (importRecord.status !== 'published') {
        return { success: false, message: 'Only published imports can be rolled back', rolledBackRows: 0 };
      }

      // Find the import session that was created for this import
      const [importSession] = await db.select()
        .from(importSessions)
        .where(eq(importSessions.name, importRecord.name))
        .limit(1);

      if (!importSession) {
        return { success: false, message: 'Import session not found', rolledBackRows: 0 };
      }

      // Delete the data points that were published
      const deletedDataPoints = await db.delete(dataPoints)
        .where(eq(dataPoints.importSessionId, importSession.id))
        .returning();

      // Update import status
      await db.update(csvImports)
        .set({ 
          status: 'rolled_back',
          errorMessage: `Rolled back by user ${userId} on ${new Date().toISOString()}`
        })
        .where(eq(csvImports.id, sessionId));

      return {
        success: true,
        message: `Successfully rolled back ${deletedDataPoints.length} data points`,
        rolledBackRows: deletedDataPoints.length
      };

    } catch (error) {
      return {
        success: false,
        message: 'Rollback failed',
        rolledBackRows: 0
      };
    }
  }

  /**
   * Retry a failed import
   */
  static async retryImport(sessionId: number, userId: number): Promise<CSVImportResult> {
    const db = getDb();
    try {
      // Get the original import
      const [originalImport] = await db.select()
        .from(csvImports)
        .where(eq(csvImports.id, sessionId));

      if (!originalImport) {
        return { success: false, message: 'Import not found' };
      }

      if (originalImport.status !== 'failed' && originalImport.status !== 'validation_failed') {
        return { success: false, message: 'Only failed imports can be retried' };
      }

      // Create a new import record for the retry
      const [retryImport] = await db.insert(csvImports).values({
        name: `${originalImport.name} (Retry)`,
        description: `Retry of import ${sessionId}`,
        filename: originalImport.filename,
        fileSize: originalImport.fileSize,
        fileHash: originalImport.fileHash,
        status: 'uploaded',
        uploadedBy: userId,
        metadata: originalImport.metadata,
        duplicateOf: sessionId // Link to original
      }).returning();

      return {
        success: true,
        importId: retryImport.id,
        message: `Retry import created with ID ${retryImport.id}`
      };

    } catch (error) {
      return {
        success: false,
        message: 'Retry failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Smart duplicate file check with retry logic
   */
  static async checkDuplicateFile(fileHash: string): Promise<DuplicateCheckResult> {
    const db = getDb();
    const existingImport = await db.select()
      .from(csvImports)
      .where(eq(csvImports.fileHash, fileHash))
      .limit(1);

    if (existingImport.length === 0) {
      return { isDuplicate: false, canRetry: false };
    }

    const existing = existingImport[0];
    
    // Allow retry if previous attempt failed
    if (existing.status === 'failed' || existing.status === 'validation_failed') {
      return { 
        isDuplicate: false, 
        canRetry: true, 
        originalSession: existing as any 
      };
    }
    
    // Block only if successfully published
    if (existing.status === 'published') {
      return { 
        isDuplicate: true, 
        canRetry: false, 
        reason: 'File already successfully imported' 
      };
    }
    
    // For other statuses, allow retry
    return { 
      isDuplicate: false, 
      canRetry: true, 
      originalSession: existing as any 
    };
  }

  /**
   * Stage CSV data for validation and processing
   */
  private static async stageData(
    importId: number,
    records: any[],
    template: any
  ): Promise<{ success: boolean; stats: any }> {
    const db = getDb();
    const stagedRows = [];
    let validRows = 0;
    let invalidRows = 0;

    // Get all states for matching
    const allStates = await db.select().from(states);
    const stateMap = new Map();
    allStates.forEach((state: any) => {
      stateMap.set(state.name.toLowerCase(), state.id);
      stateMap.set(state.abbreviation.toLowerCase(), state.id);
    });

    // Get all categories and statistics
    const allCategories = await db.select().from(categories);
    const allStatistics = await db.select().from(statistics);

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2;

      try {
        let mappedData: any = {};

        if (template.name.includes('Multi-Category')) {
          // Multi-category template: State, Year, Category, Measure, Value
          mappedData = {
            stateName: record.State || record.state,
            year: parseInt(record.Year || record.year),
            categoryName: record.Category || record.category,
            statisticName: record.Measure || record.measure || record.Statistic,
            value: parseFloat(record.Value || record.value)
          };
        } else if (template.name.includes('Multi Year Export')) {
          // Multi Year Export template: ID, State, Year, Category, Measure Name, Value, state_id, category_id, measure_id
          mappedData = {
            stateName: record.State || record.state,
            year: parseInt(record.Year || record.year),
            categoryName: record.Category || record.category,
            statisticName: record['Measure Name'] || record['MeasureName'] || record.Measure || record.measure,
            value: parseFloat(record.Value || record.value)
          };
        } else {
          // Single-category template: State, Year, Value
          mappedData = {
            stateName: record.State || record.state,
            year: parseInt(record.Year || record.year),
            value: parseFloat(record.Value || record.value)
          };
          
          // Use metadata for category and measure
          const metadata = await this.getImportMetadata(importId);
          mappedData.categoryName = metadata.categoryName;
          mappedData.statisticName = metadata.statisticName;
        }

        // Validate required fields
        if (!mappedData.stateName || !mappedData.year || mappedData.value === null || isNaN(mappedData.value)) {
          invalidRows++;
          stagedRows.push({
            csvImportId: importId,
            rowNumber,
            rawData: JSON.stringify(record),
            validationStatus: 'invalid',
            validationErrors: JSON.stringify(['Missing or invalid required fields'])
          });
          continue;
        }

        // Match state
        const stateNameLower = mappedData.stateName.toLowerCase().trim();
        const stateId = stateMap.get(stateNameLower);
        
        if (!stateId) {
          invalidRows++;
          stagedRows.push({
            csvImportId: importId,
            rowNumber,
            rawData: JSON.stringify(record),
            validationStatus: 'invalid',
            validationErrors: JSON.stringify([`State "${mappedData.stateName}" not found`])
          });
          continue;
        }

        // Match category and statistic (for multi-category and multi-year-export templates)
        let categoryId: number | null = null;
        let statisticId: number | null = null;

        if (template.name.includes('Multi-Category') || template.name.includes('Multi Year Export')) {
          const categoryMatch = allCategories.find((c: any) => 
            c.name.toLowerCase() === mappedData.categoryName.toLowerCase()
          );
          
          if (!categoryMatch) {
            invalidRows++;
            stagedRows.push({
              csvImportId: importId,
              rowNumber,
              rawData: JSON.stringify(record),
              validationStatus: 'invalid',
              validationErrors: JSON.stringify([`Category "${mappedData.categoryName}" not found`])
            });
            continue;
          }
          categoryId = categoryMatch.id;

          const statisticMatch = allStatistics.find((s: any) => 
            s.name.toLowerCase() === mappedData.statisticName.toLowerCase() &&
            s.categoryId === categoryId
          );
          
          if (!statisticMatch) {
            invalidRows++;
            stagedRows.push({
              csvImportId: importId,
              rowNumber,
              rawData: JSON.stringify(record),
              validationStatus: 'invalid',
              validationErrors: JSON.stringify([`Statistic "${mappedData.statisticName}" not found in category "${mappedData.categoryName}"`])
            });
            continue;
          }
          statisticId = statisticMatch.id;
        } else {
          // Single-category template - use metadata
          const metadata = await this.getImportMetadata(importId);
          categoryId = metadata.categoryId;
          statisticId = metadata.statisticId;
        }

        validRows++;
        stagedRows.push({
          csvImportId: importId,
          rowNumber,
          stateName: mappedData.stateName,
          stateId,
          year: mappedData.year,
          statisticName: mappedData.statisticName,
          statisticId,
          value: mappedData.value,
          rawData: JSON.stringify(record),
          validationStatus: 'valid',
          isProcessed: 0,
          processedAt: null
        });

      } catch (error) {
        invalidRows++;
        stagedRows.push({
          csvImportId: importId,
          rowNumber,
          rawData: JSON.stringify(record),
          validationStatus: 'invalid',
          validationErrors: JSON.stringify([error instanceof Error ? error.message : 'Unknown error'])
        });
      }
    }

    // Bulk insert staged data
    if (stagedRows.length > 0) {
      await db.insert(csvImportStaging).values(stagedRows);
    }

    return {
      success: true,
      stats: {
        totalRows: records.length,
        validRows,
        invalidRows
      }
    };
  }

  /**
   * Get template by ID
   */
  private static async getTemplate(id: number): Promise<any> {
    const db = getDb();
    const [template] = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.id, id));

    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      templateSchema: JSON.parse(template.templateSchema),
      validationRules: JSON.parse(template.validationRules || '{}')
    };
  }

  /**
   * Get import metadata
   */
  private static async getImportMetadata(importId: number): Promise<any> {
    const db = getDb();
    const metadata = await db.select()
      .from(csvImportMetadata)
      .where(eq(csvImportMetadata.csvImportId, importId));

    const result: any = {};
    for (const item of metadata) {
      result[item.key] = item.value;
    }
    return result;
  }
} 