import { db } from '../db/index';
import { 
  csvImports, 
  csvImportMetadata, 
  csvImportValidation, 
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

export interface CSVImportTemplate {
  id: number;
  name: string;
  description: string;
  categoryId?: number;
  dataSourceId?: number;
  templateSchema: CSVSchema;
  validationRules: ValidationRules;
  sampleData: string;
}

export interface CSVSchema {
  columns: {
    name: string;
    type: 'string' | 'number' | 'date' | 'boolean';
    required: boolean;
    mapping?: string; // Maps to internal field (state_name, year, value, etc.)
    validation?: ValidationRule;
  }[];
  expectedHeaders: string[];
}

export interface ValidationRule {
  type: 'range' | 'regex' | 'enum' | 'custom';
  value: any;
  message: string;
}

export interface ValidationRules {
  stateName: ValidationRule[];
  year: ValidationRule[];
  value: ValidationRule[];
  custom: ValidationRule[];
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

export interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    warnings: number;
  };
}

export class CSVImportService {
  /**
   * Upload and stage a CSV file for import
   */
  static async uploadCSV(
    file: File,
    templateId: number,
    metadata: Record<string, any>,
    uploadedBy: number
  ): Promise<CSVImportResult> {
    try {
      // Read and parse the file
      const fileBuffer = await file.arrayBuffer();
      const fileContent = new TextDecoder().decode(fileBuffer);
      const fileHash = createHash('sha256').update(fileContent).digest('hex');

      // Check for duplicate uploads
      const existingImport = await db.select()
        .from(csvImports)
        .where(eq(csvImports.fileHash, fileHash))
        .limit(1);

      if (existingImport.length > 0) {
        return {
          success: false,
          message: 'This file has already been uploaded',
          errors: ['Duplicate file detected']
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
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      // Create import record
      const [importRecord] = await db.insert(csvImports).values({
        name: metadata.name || `Import from ${file.name}`,
        description: metadata.description,
        filename: file.name,
        fileSize: file.size,
        fileHash,
        status: 'uploaded',
        uploadedBy,
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
      return {
        success: false,
        message: 'Upload failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Stage CSV data for validation and processing
   */
  static async stageData(
    importId: number,
    records: any[],
    template: CSVImportTemplate
  ): Promise<{ success: boolean; stats: any }> {
    const stagedRows = [];
    let validRows = 0;
    let invalidRows = 0;
    let warnings = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const rowNumber = i + 2; // +2 because CSV is 1-based and we skip header

      try {
        // Map CSV columns to internal fields
        const mappedData = this.mapCSVRow(record, template.templateSchema);
        
        // Basic validation
        const validation = this.validateRow(mappedData, template.validationRules);
        
        const stagedRow = {
          csvImportId: importId,
          rowNumber,
          stateName: mappedData.stateName,
          stateId: mappedData.stateId,
          year: mappedData.year,
          statisticName: mappedData.statisticName,
          statisticId: mappedData.statisticId,
          value: mappedData.value,
          rawData: JSON.stringify(record),
          validationStatus: validation.isValid ? 'valid' : 'invalid',
          validationErrors: validation.errors.length > 0 ? JSON.stringify(validation.errors) : null
        };

        stagedRows.push(stagedRow);

        if (validation.isValid) {
          validRows++;
        } else {
          invalidRows++;
        }

        warnings += validation.warnings.length;

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
        invalidRows,
        warnings
      }
    };
  }

  /**
   * Validate staged data
   */
  static async validateImport(importId: number): Promise<CSVValidationResult> {
    const stagedData = await db.select()
      .from(csvImportStaging)
      .where(eq(csvImportStaging.csvImportId, importId))
      .orderBy(csvImportStaging.rowNumber);

    const errors: string[] = [];
    const warnings: string[] = [];
    let validRows = 0;
    let invalidRows = 0;

    // Business rule validations
    for (const row of stagedData) {
      const rowErrors: string[] = [];
      const rowWarnings: string[] = [];

      // Check state exists
      if (row.stateName && !row.stateId) {
        rowErrors.push(`State "${row.stateName}" not found in database`);
      }

      // Check statistic exists
      if (row.statisticName && !row.statisticId) {
        rowErrors.push(`Statistic "${row.statisticName}" not found in database`);
      }

      // Check for duplicate data
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
        errors.push(`Row ${row.rowNumber}: ${rowErrors.join(', ')}`);
      } else {
        validRows++;
      }

      warnings.push(...rowWarnings.map(w => `Row ${row.rowNumber}: ${w}`));
    }

    // Update validation status
    await db.update(csvImports)
      .set({ 
        status: errors.length > 0 ? 'failed' : 'validated',
        validatedAt: new Date(),
        errorMessage: errors.length > 0 ? errors.slice(0, 5).join('; ') : null
      })
      .where(eq(csvImports.id, importId));

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats: {
        totalRows: stagedData.length,
        validRows,
        invalidRows,
        warnings: warnings.length
      }
    };
  }

  /**
   * Publish validated data to the main dataPoints table
   */
  static async publishImport(importId: number): Promise<{ success: boolean; message: string; publishedRows: number }> {
    try {
      // Get import details
      const [importRecord] = await db.select()
        .from(csvImports)
        .where(eq(csvImports.id, importId));

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
          eq(csvImportStaging.csvImportId, importId),
          eq(csvImportStaging.validationStatus, 'valid')
        ));

      if (stagedData.length === 0) {
        return { success: false, message: 'No valid data to publish', publishedRows: 0 };
      }

      // Create import session
      const [importSession] = await db.insert(importSessions).values({
        name: importRecord.name,
        description: importRecord.description,
        dataYear: new Date().getFullYear(),
        recordCount: stagedData.length
      }).returning();

      // Prepare data points
      const dataPointsToInsert = stagedData
        .filter(row => row.stateId && row.statisticId && row.value !== null)
        .map(row => ({
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
        .where(eq(csvImportStaging.csvImportId, importId));

      // Update import status
      await db.update(csvImports)
        .set({ 
          status: 'published',
          publishedAt: new Date()
        })
        .where(eq(csvImports.id, importId));

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
   * Get import templates
   */
  static async getTemplates(): Promise<CSVImportTemplate[]> {
    const templates = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.isActive, 1))
      .orderBy(csvImportTemplates.name);

    return templates.map(t => ({
      ...t,
      templateSchema: JSON.parse(t.templateSchema),
      validationRules: JSON.parse(t.validationRules)
    }));
  }

  /**
   * Get template by ID
   */
  static async getTemplate(id: number): Promise<CSVImportTemplate | null> {
    const [template] = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.id, id));

    if (!template) return null;

    return {
      ...template,
      templateSchema: JSON.parse(template.templateSchema),
      validationRules: JSON.parse(template.validationRules)
    };
  }

  /**
   * Get import history
   */
  static async getImportHistory(limit = 50): Promise<any[]> {
    return await db.select({
      id: csvImports.id,
      name: csvImports.name,
      filename: csvImports.filename,
      status: csvImports.status,
      uploadedAt: csvImports.uploadedAt,
      validatedAt: csvImports.validatedAt,
      publishedAt: csvImports.publishedAt,
      uploadedBy: users.name
    })
    .from(csvImports)
    .leftJoin(users, eq(csvImports.uploadedBy, users.id))
    .orderBy(desc(csvImports.uploadedAt))
    .limit(limit);
  }

  /**
   * Get import details with staging data
   */
  static async getImportDetails(importId: number): Promise<any> {
    const [importRecord] = await db.select()
      .from(csvImports)
      .where(eq(csvImports.id, importId));

    if (!importRecord) return null;

    const stagedData = await db.select()
      .from(csvImportStaging)
      .where(eq(csvImportStaging.csvImportId, importId))
      .orderBy(csvImportStaging.rowNumber);

    const metadata = await db.select()
      .from(csvImportMetadata)
      .where(eq(csvImportMetadata.csvImportId, importId));

    return {
      ...importRecord,
      metadata: JSON.parse(importRecord.metadata || '{}'),
      stagedData,
      metadataFields: metadata
    };
  }

  // Helper methods
  private static mapCSVRow(record: any, schema: CSVSchema): any {
    const mapped: any = {};

    for (const column of schema.columns) {
      const value = record[column.name];
      
      if (column.mapping) {
        mapped[column.mapping] = this.convertValue(value, column.type);
      }
    }

    return mapped;
  }

  private static convertValue(value: any, type: string): any {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    switch (type) {
      case 'number':
        return parseFloat(value);
      case 'date':
        return new Date(value);
      case 'boolean':
        return value.toLowerCase() === 'true' || value === '1';
      default:
        return String(value).trim();
    }
  }

  private static validateRow(data: any, rules: ValidationRules): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // State name validation
    if (data.stateName) {
      for (const rule of rules.stateName || []) {
        if (!this.validateField(data.stateName, rule)) {
          errors.push(rule.message);
        }
      }
    }

    // Year validation
    if (data.year) {
      for (const rule of rules.year || []) {
        if (!this.validateField(data.year, rule)) {
          errors.push(rule.message);
        }
      }
    }

    // Value validation
    if (data.value !== null && data.value !== undefined) {
      for (const rule of rules.value || []) {
        if (!this.validateField(data.value, rule)) {
          errors.push(rule.message);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateField(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'range':
        return value >= rule.value.min && value <= rule.value.max;
      case 'regex':
        return new RegExp(rule.value).test(String(value));
      case 'enum':
        return rule.value.includes(value);
      default:
        return true;
    }
  }
} 