import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { setupTestDatabase, seedTestData, cleanupTestDatabase, getTestDb } from '../test-setup';

describe('Debug Database Setup', () => {
  beforeAll(async () => {
    console.log('🔧 Setting up test database...');
    await setupTestDatabase();
    console.log('✅ Test database setup complete');
    await seedTestData();
    console.log('✅ Test data seeded');
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  it('should show database setup process', async () => {
    const db = getTestDb();
    
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
    
    // Try to create the table manually if it doesn't exist
    if (!csvImportsExists || csvImportsExists.length === 0) {
      console.log('🔧 Creating csv_imports table manually...');
      await db.run(`
        CREATE TABLE IF NOT EXISTS csv_imports (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          filename TEXT NOT NULL,
          uploaded_by INTEGER NOT NULL,
          uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          status TEXT NOT NULL DEFAULT 'uploaded',
          validated_at INTEGER,
          published_at INTEGER,
          error_message TEXT,
          metadata TEXT,
          is_active INTEGER DEFAULT 1,
          duplicate_of INTEGER,
          total_rows INTEGER,
          valid_rows INTEGER,
          error_rows INTEGER,
          processing_time_ms INTEGER,
          FOREIGN KEY (uploaded_by) REFERENCES users(id)
        )
      `);
      console.log('✅ csv_imports table created manually');
    }
    
    // Check again
    const csvImportsExistsAfter = await db.run(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='csv_imports'
    `);
    
    console.log('📁 csv_imports table exists after manual creation:', csvImportsExistsAfter);
    
    expect(tables).toBeDefined();
  });
}); 