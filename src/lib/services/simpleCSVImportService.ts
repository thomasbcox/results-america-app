import { db } from '../db/index';
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
import { sql } from 'drizzle-orm';

export interface SimpleCSVTemplate {
  id: number;
  name: string;
  description: string;
  type: 'multi-category' | 'single-category';
  expectedHeaders: string[];
  sampleData: string;
}

export interface CSVImportResult {
  success: boolean;
  importId?: number;
  message: string;
  errors?: string[];
  stats?: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
  };
}

export class SimpleCSVImportService {
  /**
   * Get the two available templates
   */
  static async getTemplates(): Promise<SimpleCSVTemplate[]> {
    // Create templates if they don't exist
    await this.ensureTemplates();
    
    const templates = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.isActive, 1))
      .orderBy(csvImportTemplates.name);

    return templates.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      type: t.name.includes('Multi-Category') ? 'multi-category' : 'single-category',
      expectedHeaders: JSON.parse(t.templateSchema).expectedHeaders,
      sampleData: t.sampleData || ''
    }));
  }

  /**
   * Upload and process a CSV file
   */
  static async uploadCSV(
    file: File,
    templateId: number,
    metadata: Record<string, any>,
    uploadedBy: number
  ): Promise<CSVImportResult> {
    try {
      console.log('SimpleCSVImportService.uploadCSV started');
      
      // Read and parse the file
      const fileBuffer = await file.arrayBuffer();
      let fileContent = new TextDecoder().decode(fileBuffer);
      
      // Basic CSV preprocessing
      fileContent = fileContent.replace(/^\uFEFF/, ''); // Remove BOM
      fileContent = fileContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      fileContent = fileContent.split('\n').filter(line => line.trim()).join('\n');
      
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
      let records;
      try {
        records = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
      } catch (parseError) {
        return {
          success: false,
          message: 'CSV parsing failed',
          errors: [`CSV parsing error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`]
        };
      }

      // Validate headers
      const headerValidation = this.validateHeaders(records[0], template);
      if (!headerValidation.isValid) {
        return {
          success: false,
          message: 'Invalid CSV headers',
          errors: headerValidation.errors
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

      // Process the data
      const processingResult = await this.processData(importRecord.id, records, template);
      
      // Update import status
      await db.update(csvImports)
        .set({ status: 'staged' })
        .where(eq(csvImports.id, importRecord.id));

      return {
        success: true,
        importId: importRecord.id,
        message: `Successfully uploaded and processed ${processingResult.stats.totalRows} rows`,
        stats: processingResult.stats
      };

    } catch (error) {
      console.error('SimpleCSVImportService.uploadCSV error:', error);
      return {
        success: false,
        message: 'Upload failed',
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Process CSV data based on template type
   */
  static async processData(
    importId: number,
    records: any[],
    template: SimpleCSVTemplate
  ): Promise<{ success: boolean; stats: any }> {
    const stagedRows = [];
    let validRows = 0;
    let invalidRows = 0;

    // Get all states for matching
    const allStates = await db.select().from(states);
    const stateMap = new Map();
    allStates.forEach(state => {
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

        if (template.type === 'multi-category') {
          // Multi-category template: State, Year, Category, Measure, Value
          mappedData = {
            stateName: record.State || record.state,
            year: parseInt(record.Year || record.year),
            categoryName: record.Category || record.category,
            statisticName: record.Measure || record.measure || record.Statistic,
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

        // Match category and statistic (for multi-category template)
        let categoryId = null;
        let statisticId = null;

        if (template.type === 'multi-category') {
          const categoryMatch = allCategories.find(c => 
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

          const statisticMatch = allStatistics.find(s => 
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

        // Check for duplicate data
        const existingData = await db.select()
          .from(dataPoints)
          .where(and(
            eq(dataPoints.stateId, stateId),
            eq(dataPoints.statisticId, statisticId),
            eq(dataPoints.year, mappedData.year)
          ));

        if (existingData.length > 0) {
          // Update existing data instead of creating duplicate
          await db.update(dataPoints)
            .set({ value: mappedData.value })
            .where(and(
              eq(dataPoints.stateId, stateId),
              eq(dataPoints.statisticId, statisticId),
              eq(dataPoints.year, mappedData.year)
            ));
        } else {
          // Create new data point
          await db.insert(dataPoints).values({
            stateId,
            statisticId,
            year: mappedData.year,
            value: mappedData.value,
            importSessionId: await this.getImportSessionId(importId)
          });
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
          isProcessed: 1,
          processedAt: new Date()
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
   * Validate CSV headers against template
   */
  static validateHeaders(headers: any, template: SimpleCSVTemplate): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const actualHeaders = Object.keys(headers || {});

    for (const expectedHeader of template.expectedHeaders) {
      if (!actualHeaders.some(h => h.toLowerCase() === expectedHeader.toLowerCase())) {
        errors.push(`Missing required column: ${expectedHeader}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get template by ID
   */
  static async getTemplate(id: number): Promise<SimpleCSVTemplate | null> {
    const [template] = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.id, id));

    if (!template) return null;

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.name.includes('Multi-Category') ? 'multi-category' : 'single-category',
      expectedHeaders: JSON.parse(template.templateSchema).expectedHeaders,
      sampleData: template.sampleData || ''
    };
  }

  /**
   * Get import metadata
   */
  static async getImportMetadata(importId: number): Promise<any> {
    const metadata = await db.select()
      .from(csvImportMetadata)
      .where(eq(csvImportMetadata.csvImportId, importId));

    const result: any = {};
    for (const item of metadata) {
      result[item.key] = item.value;
    }
    return result;
  }

  /**
   * Get or create import session
   */
  static async getImportSessionId(importId: number): Promise<number> {
    const [importRecord] = await db.select()
      .from(csvImports)
      .where(eq(csvImports.id, importId));

    if (!importRecord) {
      throw new Error('Import record not found');
    }

    // Check if import session already exists
    const [existingSession] = await db.select()
      .from(importSessions)
      .where(eq(importSessions.name, importRecord.name))
      .limit(1);

    if (existingSession) {
      return existingSession.id;
    }

    // Create new import session
    const [newSession] = await db.insert(importSessions).values({
      name: importRecord.name,
      description: importRecord.description,
      dataYear: new Date().getFullYear(),
      recordCount: 0
    }).returning();

    return newSession.id;
  }

  /**
   * Ensure templates exist
   */
  static async ensureTemplates(): Promise<void> {
    const existingTemplates = await db.select()
      .from(csvImportTemplates)
      .where(eq(csvImportTemplates.isActive, 1));

    // Check if our specific templates exist
    const hasMultiCategory = existingTemplates.some(t => t.name === 'Multi-Category Data Import');
    const hasSingleCategory = existingTemplates.some(t => t.name === 'Single-Category Data Import');

    if (hasMultiCategory && hasSingleCategory) {
      return; // Our templates already exist
    }

    // Create Multi-Category Template if it doesn't exist
    if (!hasMultiCategory) {
      await db.insert(csvImportTemplates).values({
        name: 'Multi-Category Data Import',
        description: 'Import data with multiple categories and measures. Each row can have different categories and measures.',
        templateSchema: JSON.stringify({
          expectedHeaders: ['State', 'Year', 'Category', 'Measure', 'Value']
        }),
        sampleData: `State,Year,Category,Measure,Value
California,2023,Economy,GDP,3500000
Texas,2023,Economy,GDP,2200000
California,2023,Education,Graduation Rate,85.2
Texas,2023,Education,Graduation Rate,89.1`,
        isActive: 1,
        createdBy: 3 // Use existing admin user ID
      }).onConflictDoNothing();
      console.log('✅ Created Multi-Category Data Import template');
    }

    // Create Single-Category Template if it doesn't exist
    if (!hasSingleCategory) {
      await db.insert(csvImportTemplates).values({
        name: 'Single-Category Data Import',
        description: 'Import data for one specific category and measure. All rows must be for the same category and measure.',
        templateSchema: JSON.stringify({
          expectedHeaders: ['State', 'Year', 'Value']
        }),
        sampleData: `State,Year,Value
California,2023,3500000
Texas,2023,2200000
New York,2023,1800000
Florida,2023,1200000`,
        isActive: 1,
        createdBy: 3 // Use existing admin user ID
      }).onConflictDoNothing();
      console.log('✅ Created Single-Category Data Import template');
    }
  }
} 