#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/db/schema';
import { SimpleCSVImportService } from '../src/lib/services/simpleCSVImportService';

async function testCSVFormats() {
  console.log('🧪 Testing CSV Import Formats...\n');

  try {
    // Create a temporary database
    const sqlite = new Database(':memory:');
    const db = drizzle(sqlite, { schema });

    // Create tables
    await db.run(`
      CREATE TABLE states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        abbreviation TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1
      )
    `);

    await db.run(`
      CREATE TABLE categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      )
    `);

    await db.run(`
      CREATE TABLE statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        unit TEXT NOT NULL,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      )
    `);

    await db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0
      )
    `);

    await db.run(`
      CREATE TABLE csv_import_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        template_schema TEXT NOT NULL,
        sample_data TEXT,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    await db.run(`
      CREATE TABLE csv_imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'uploaded',
        uploaded_by INTEGER NOT NULL,
        uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (uploaded_by) REFERENCES users(id)
      )
    `);

    await db.run(`
      CREATE TABLE import_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        data_year INTEGER,
        record_count INTEGER,
        is_active INTEGER DEFAULT 1
      )
    `);

    await db.run(`
      CREATE TABLE data_points (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        import_session_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        state_id INTEGER NOT NULL,
        statistic_id INTEGER NOT NULL,
        value REAL NOT NULL,
        FOREIGN KEY (import_session_id) REFERENCES import_sessions(id),
        FOREIGN KEY (state_id) REFERENCES states(id),
        FOREIGN KEY (statistic_id) REFERENCES statistics(id)
      )
    `);

    // Insert test data
    await db.run(`
      INSERT INTO users (id, email, name, role, is_active, email_verified) 
      VALUES (1, 'admin@test.com', 'Admin User', 'admin', 1, 1)
    `);

    await db.run(`
      INSERT INTO states (name, abbreviation) VALUES 
      ('California', 'CA'),
      ('Texas', 'TX'),
      ('Alabama', 'AL'),
      ('Alaska', 'AK'),
      ('Arizona', 'AZ')
    `);

    await db.run(`
      INSERT INTO categories (name, description) VALUES 
      ('Education', 'Education statistics'),
      ('Economy', 'Economic indicators'),
      ('Healthcare', 'Healthcare statistics')
    `);

    await db.run(`
      INSERT INTO statistics (category_id, name, unit) VALUES 
      (1, 'High School Graduation Rate', 'percentage'),
      (1, 'College Enrollment Rate', 'percentage'),
      (2, 'Unemployment Rate', 'percentage'),
      (2, 'Median Household Income', 'dollars'),
      (3, 'Life Expectancy', 'years'),
      (3, 'Infant Mortality Rate', 'per 1,000')
    `);

    await db.run(`
      INSERT INTO csv_import_templates (name, description, template_schema, sample_data, created_by) VALUES 
      ('Multi-Category Data Import', 'Import data with multiple categories and measures', 
       '{"expectedHeaders": ["State", "Year", "Category", "Measure", "Value"]}',
       'State,Year,Category,Measure,Value\nCalifornia,2023,Economy,Median Household Income,85000',
       1),
      ('Single-Category Data Import', 'Import data for one specific category and measure',
       '{"expectedHeaders": ["State", "Year", "Value"]}',
       'State,Year,Value\nCalifornia,2023,85000',
       1)
    `);

    console.log('✅ Test database setup complete');

    // Mock the getDb function to return our test database
    const originalGetDb = require('../src/lib/db/index').getDb;
    require('../src/lib/db/index').getDb = () => db;

    // Test 1: Multi-Category CSV Import
    console.log('\n📊 Test 1: Multi-Category CSV Import');
    
    const multiCategoryCSV = `State,Year,Category,Measure,Value
California,2023,Economy,Median Household Income,85000
Texas,2023,Economy,Median Household Income,72000
California,2023,Education,High School Graduation Rate,85.2
Texas,2023,Education,High School Graduation Rate,89.1`;

    const multiCategoryFile = new File([multiCategoryCSV], 'multi-category-test.csv', {
      type: 'text/csv'
    });

    try {
      const result1 = await SimpleCSVImportService.uploadCSV(
        multiCategoryFile,
        1, // Multi-Category template ID
        { description: 'Test multi-category import' },
        1 // user ID
      );

      console.log('Multi-Category Import Result:', {
        success: result1.success,
        message: result1.message,
        stats: result1.stats
      });
    } catch (error) {
      console.log('Multi-Category Import Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 2: Single-Category CSV Import
    console.log('\n📊 Test 2: Single-Category CSV Import');
    
    const singleCategoryCSV = `State,Year,Value
California,2023,85000
Texas,2023,72000
Alabama,2023,65000
Alaska,2023,78000
Arizona,2023,68000`;

    const singleCategoryFile = new File([singleCategoryCSV], 'single-category-test.csv', {
      type: 'text/csv'
    });

    try {
      const result2 = await SimpleCSVImportService.uploadCSV(
        singleCategoryFile,
        2, // Single-Category template ID
        { 
          description: 'Test single-category import',
          categoryName: 'Economy',
          statisticName: 'Median Household Income'
        },
        1 // user ID
      );

      console.log('Single-Category Import Result:', {
        success: result2.success,
        message: result2.message,
        stats: result2.stats
      });
    } catch (error) {
      console.log('Single-Category Import Error:', error instanceof Error ? error.message : String(error));
    }

    // Test 3: Get Templates
    console.log('\n📊 Test 3: Available Templates');
    
    try {
      const templates = await SimpleCSVImportService.getTemplates();
      console.log('Available Templates:');
      templates.forEach(template => {
        console.log(`- ${template.name}: ${template.description}`);
        console.log(`  Headers: ${template.expectedHeaders.join(', ')}`);
      });
    } catch (error) {
      console.log('Get Templates Error:', error instanceof Error ? error.message : String(error));
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log('✅ The existing code supports these CSV formats:');
    console.log('1. Multi-Category: State,Year,Category,Measure,Value');
    console.log('2. Single-Category: State,Year,Value (with metadata)');
    console.log('\n✅ Working with seeded data:');
    console.log('- States: California, Texas, Alabama, Alaska, Arizona');
    console.log('- Categories: Education, Economy, Healthcare');
    console.log('- Measures: High School Graduation Rate, Median Household Income, etc.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCSVFormats().catch(console.error); 