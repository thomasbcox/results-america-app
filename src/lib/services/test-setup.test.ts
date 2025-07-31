import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupTestDatabase, seedTestData, cleanupTestDatabase, getTestDb } from '../test-setup';
import { states, categories, statistics, dataSources, importSessions, dataPoints, users, csvImports, importLogs, importValidationSummary, csvImportStaging, csvImportTemplates, csvImportMetadata, csvImportValidation } from '../db/schema';

describe('Test Database Setup', () => {
  beforeAll(async () => {
    await setupTestDatabase();
    await seedTestData();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should list all tables in database', async () => {
    const db = getTestDb();
    
    // Get all table names using raw SQL
    const result = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    // Check if specific tables exist
    const csvImportsExists = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='csv_imports'
    `);
    
    const importLogsExists = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='import_logs'
    `);
    
    const importValidationSummaryExists = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='import_validation_summary'
    `);
    
    // Log results
    console.log('All tables result:', result);
    console.log('csv_imports exists:', csvImportsExists);
    console.log('import_logs exists:', importLogsExists);
    console.log('import_validation_summary exists:', importValidationSummaryExists);
    
    expect(result).toBeDefined();
  });

  it('should have all required tables', async () => {
    const db = getTestDb();
    
    // Check if core tables exist
    const statesResult = await db.select().from(states).limit(1);
    expect(statesResult).toBeDefined();
    
    const categoriesResult = await db.select().from(categories).limit(1);
    expect(categoriesResult).toBeDefined();
    
    const statisticsResult = await db.select().from(statistics).limit(1);
    expect(statisticsResult).toBeDefined();
    
    const dataSourcesResult = await db.select().from(dataSources).limit(1);
    expect(dataSourcesResult).toBeDefined();
    
    const importSessionsResult = await db.select().from(importSessions).limit(1);
    expect(importSessionsResult).toBeDefined();
    
    const dataPointsResult = await db.select().from(dataPoints).limit(1);
    expect(dataPointsResult).toBeDefined();
    
    const usersResult = await db.select().from(users).limit(1);
    expect(usersResult).toBeDefined();
    
    // Check if CSV import tables exist
    const csvImportsResult = await db.select().from(csvImports).limit(1);
    expect(csvImportsResult).toBeDefined();
    
    const importLogsResult = await db.select().from(importLogs).limit(1);
    expect(importLogsResult).toBeDefined();
    
    const importValidationSummaryResult = await db.select().from(importValidationSummary).limit(1);
    expect(importValidationSummaryResult).toBeDefined();
    
    const csvImportStagingResult = await db.select().from(csvImportStaging).limit(1);
    expect(csvImportStagingResult).toBeDefined();
    
    const csvImportTemplatesResult = await db.select().from(csvImportTemplates).limit(1);
    expect(csvImportTemplatesResult).toBeDefined();
    
    const csvImportMetadataResult = await db.select().from(csvImportMetadata).limit(1);
    expect(csvImportMetadataResult).toBeDefined();
    
    const csvImportValidationResult = await db.select().from(csvImportValidation).limit(1);
    expect(csvImportValidationResult).toBeDefined();
  });

  it('should have seeded data', async () => {
    const db = getTestDb();
    
    const statesResult = await db.select().from(states);
    expect(statesResult.length).toBeGreaterThan(0);
    
    const categoriesResult = await db.select().from(categories);
    expect(categoriesResult.length).toBeGreaterThan(0);
    
    const statisticsResult = await db.select().from(statistics);
    expect(statisticsResult.length).toBeGreaterThan(0);
    
    const usersResult = await db.select().from(users);
    expect(usersResult.length).toBeGreaterThan(0);
  });
}); 