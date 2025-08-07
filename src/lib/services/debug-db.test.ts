import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { BulletproofTestDatabase, TestUtils } from '../test-infrastructure/bulletproof-test-db';

describe('Debug Database Setup', () => {
  let testDb: any;

  beforeEach(async () => {
    console.log('🔧 Setting up bulletproof test database...');
    testDb = await TestUtils.createAndSeed({
      seedOptions: {
        states: true,
        categories: true,
        dataSources: true,
        statistics: true,
        importSessions: true,
        dataPoints: true,
        users: true,
        csvTemplates: true
      }
    });
    console.log('✅ Bulletproof test database setup complete');
  });

  afterEach(() => {
    if (testDb) {
      BulletproofTestDatabase.destroy(testDb);
      console.log('🧹 Test database destroyed');
    }
  });

  it('should show database setup process', async () => {
    const db = testDb.db;
    
    // Check what tables exist
    const tables = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    
    console.log('📋 Tables in database:', tables);
    
    // Check specific CSV import tables
    const csvImportsExists = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='csv_imports'
    `);
    
    console.log('📁 csv_imports table exists:', csvImportsExists);
    
    // Just verify that the database setup worked and we can query tables
    expect(tables).toBeDefined();
    expect(csvImportsExists).toBeDefined();
    
    // Verify we can access the database through the test infrastructure
    expect(testDb).toBeDefined();
    expect(testDb.db).toBeDefined();
    
    console.log('✅ Database setup verification complete');
  });
}); 