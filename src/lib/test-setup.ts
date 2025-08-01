import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as sqliteSchema from './db/schema';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync, mkdirSync } from 'fs';

// Load environment variables for tests
config({ path: '.env' });

// Set test environment
(process.env as any).NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test timeout
jest.setTimeout(10000);

// Test database utilities
let testDb: any;
let testDbPath: string;

// Generate a unique test database file path
function getTestDbPath(): string {
  if (!testDbPath) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    testDbPath = join(tmpdir(), `test-db-${timestamp}-${randomId}.db`);
    // Set environment variable so db/index.ts uses the same file
    process.env.TEST_DB_PATH = testDbPath;
  }
  return testDbPath;
}

// Clean up test database file
export function cleanupTestDatabase() {
  if (testDb) {
    try {
      testDb.close?.();
      testDb = null;
    } catch (error) {
      // Ignore errors when closing
    }
  }
  
  if (testDbPath && existsSync(testDbPath)) {
    try {
      unlinkSync(testDbPath);
    } catch (error) {
      // Ignore errors when deleting file
    }
  }
  testDbPath = '';
}

export function getTestDb() {
  if (!testDb) {
    const dbPath = getTestDbPath();
    const sqlite = new Database(dbPath);
    testDb = drizzle(sqlite, { schema: sqliteSchema });
  }
  return testDb;
}

export function createFreshTestDb() {
  // Clean up existing database
  cleanupTestDatabase();
  
  // Create a fresh file-based database
  const dbPath = getTestDbPath();
  
  // Ensure the directory exists and is writable
  const dir = dirname(dbPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  const sqlite = new Database(dbPath);
  testDb = drizzle(sqlite, { schema: sqliteSchema });
  return testDb;
}

export async function clearTestData() {
  if (testDb) {
    try {
      // Disable foreign key constraints temporarily
      await testDb.run('PRAGMA foreign_keys = OFF');
      
      // Clear all tables in reverse dependency order
      await testDb.run('DELETE FROM data_points');
      await testDb.run('DELETE FROM national_averages');
      await testDb.run('DELETE FROM user_favorites');
      await testDb.run('DELETE FROM user_suggestions');
      await testDb.run('DELETE FROM sessions');
      await testDb.run('DELETE FROM magic_links');
      await testDb.run('DELETE FROM users');
      await testDb.run('DELETE FROM import_sessions');
      await testDb.run('DELETE FROM statistics');
      await testDb.run('DELETE FROM categories');
      await testDb.run('DELETE FROM data_sources');
      await testDb.run('DELETE FROM states');
      
      // Reset auto-increment counters
      await testDb.run('DELETE FROM sqlite_sequence');
      
      // Re-enable foreign key constraints
      await testDb.run('PRAGMA foreign_keys = ON');
    } catch (error) {
      // Ignore errors if tables don't exist yet
      console.log('Tables not ready for clearing yet:', error instanceof Error ? error.message : 'Unknown error');
    }
  }
}

export async function setupTestDatabase() {
  const db = createFreshTestDb();
  sharedTestDb = db; // Set the shared instance
  
  // Run SQLite-specific migrations
  try {
    await migrate(db, { migrationsFolder: './drizzle-sqlite' });
    console.log('✅ SQLite migrations applied successfully');
  } catch (error) {
    console.log('❌ Migration failed, creating tables manually:', error instanceof Error ? error.message : 'Unknown error');
    // Fallback: Create tables manually using Drizzle schema
    const logTable = (name) => console.log(`🛠️  Creating table: ${name}`);
    logTable('states');
    await db.run(`
      CREATE TABLE IF NOT EXISTS states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        abbreviation TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1
      )
    `);
    logTable('categories');
    await db.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      )
    `);
    logTable('data_sources');
    await db.run(`
      CREATE TABLE IF NOT EXISTS data_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        url TEXT,
        is_active INTEGER DEFAULT 1
      )
    `);
    logTable('statistics');
    await db.run(`
      CREATE TABLE IF NOT EXISTS statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ra_number TEXT,
        category_id INTEGER NOT NULL,
        data_source_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        sub_measure TEXT,
        calculation TEXT,
        unit TEXT NOT NULL,
        available_since TEXT,
        data_quality TEXT DEFAULT 'mock',
        provenance TEXT,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
      )
    `);
    logTable('import_sessions');
    await db.run(`
      CREATE TABLE IF NOT EXISTS import_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        data_source_id INTEGER,
        import_date TEXT DEFAULT CURRENT_TIMESTAMP,
        data_year INTEGER,
        record_count INTEGER,
        is_active INTEGER DEFAULT 1,
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
      )
    `);
    logTable('data_points');
    await db.run(`
      CREATE TABLE IF NOT EXISTS data_points (
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
    logTable('national_averages');
    await db.run(`
      CREATE TABLE IF NOT EXISTS national_averages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        statistic_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        value REAL NOT NULL,
        calculation_method TEXT NOT NULL DEFAULT 'arithmetic_mean',
        state_count INTEGER NOT NULL,
        last_calculated INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (statistic_id) REFERENCES statistics(id)
      )
    `);
    logTable('users');
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    logTable('sessions');
    await db.run(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    logTable('magic_links');
    await db.run(`
      CREATE TABLE IF NOT EXISTS magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expiresAt INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      )
    `);
    // CSV Import Tables
    logTable('csv_imports');
    await db.run(`
      CREATE TABLE IF NOT EXISTS csv_imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        file_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'uploaded',
        uploaded_by INTEGER NOT NULL,
        uploaded_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
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
    logTable('csv_import_staging');
    await db.run(`
      CREATE TABLE IF NOT EXISTS csv_import_staging (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        csv_import_id INTEGER NOT NULL,
        row_number INTEGER NOT NULL,
        state_name TEXT,
        state_id INTEGER,
        year INTEGER,
        statistic_name TEXT,
        statistic_id INTEGER,
        value REAL,
        raw_data TEXT NOT NULL,
        validation_status TEXT NOT NULL DEFAULT 'pending',
        validation_errors TEXT,
        is_processed INTEGER NOT NULL DEFAULT 0,
        processed_at INTEGER,
        FOREIGN KEY (csv_import_id) REFERENCES csv_imports(id),
        FOREIGN KEY (state_id) REFERENCES states(id),
        FOREIGN KEY (statistic_id) REFERENCES statistics(id)
      )
    `);
    logTable('csv_import_templates');
    await db.run(`
      CREATE TABLE IF NOT EXISTS csv_import_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        category_id INTEGER,
        data_source_id INTEGER,
        template_schema TEXT NOT NULL,
        validation_rules TEXT,
        sample_data TEXT,
        is_active INTEGER DEFAULT 1,
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id),
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);
    logTable('csv_import_metadata');
    await db.run(`
      CREATE TABLE IF NOT EXISTS csv_import_metadata (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        csv_import_id INTEGER NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        data_type TEXT NOT NULL DEFAULT 'string',
        is_required INTEGER NOT NULL DEFAULT 0,
        validation_rule TEXT,
        FOREIGN KEY (csv_import_id) REFERENCES csv_imports(id),
        UNIQUE(csv_import_id, key)
      )
    `);
    logTable('csv_import_validation');
    await db.run(`
      CREATE TABLE IF NOT EXISTS csv_import_validation (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        csv_import_id INTEGER NOT NULL,
        validation_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        message TEXT,
        details TEXT,
        started_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        completed_at INTEGER,
        error_count INTEGER DEFAULT 0,
        warning_count INTEGER DEFAULT 0,
        FOREIGN KEY (csv_import_id) REFERENCES csv_imports(id)
      )
    `);
    logTable('import_logs');
    await db.run(`
      CREATE TABLE IF NOT EXISTS import_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        csv_import_id INTEGER NOT NULL,
        log_level TEXT NOT NULL,
        row_number INTEGER,
        field_name TEXT,
        field_value TEXT,
        expected_value TEXT,
        failure_category TEXT NOT NULL,
        message TEXT NOT NULL,
        details TEXT,
        timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (csv_import_id) REFERENCES csv_imports(id)
      )
    `);
    logTable('import_validation_summary');
    await db.run(`
      CREATE TABLE IF NOT EXISTS import_validation_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        csv_import_id INTEGER NOT NULL,
        total_rows INTEGER NOT NULL,
        valid_rows INTEGER NOT NULL,
        error_rows INTEGER NOT NULL,
        failure_breakdown TEXT,
        validation_time_ms INTEGER,
        status TEXT NOT NULL,
        completed_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (csv_import_id) REFERENCES csv_imports(id)
      )
    `);
  }
  
  return db;
}

export async function seedTestData() {
  const db = getTestDb();
  
  // Insert sample states using Drizzle
  await db.insert(sqliteSchema.states).values([
    { name: 'Alabama', abbreviation: 'AL', isActive: 1 },
    { name: 'Alaska', abbreviation: 'AK', isActive: 1 },
    { name: 'Arizona', abbreviation: 'AZ', isActive: 1 },
    { name: 'Arkansas', abbreviation: 'AR', isActive: 1 },
    { name: 'California', abbreviation: 'CA', isActive: 1 },
    { name: 'Colorado', abbreviation: 'CO', isActive: 1 },
    { name: 'Connecticut', abbreviation: 'CT', isActive: 1 },
    { name: 'Delaware', abbreviation: 'DE', isActive: 1 },
    { name: 'Florida', abbreviation: 'FL', isActive: 1 },
    { name: 'Georgia', abbreviation: 'GA', isActive: 1 }
  ]);
  
  // Insert sample categories using Drizzle
  await db.insert(sqliteSchema.categories).values([
    { name: 'Education', description: 'Education statistics and metrics', icon: 'graduation-cap', sortOrder: 1, isActive: 1 },
    { name: 'Healthcare', description: 'Healthcare and medical statistics', icon: 'heart', sortOrder: 2, isActive: 1 },
    { name: 'Economy', description: 'Economic indicators and data', icon: 'trending-up', sortOrder: 3, isActive: 1 },
    { name: 'Environment', description: 'Environmental and climate data', icon: 'leaf', sortOrder: 4, isActive: 1 },
    { name: 'Infrastructure', description: 'Infrastructure and transportation', icon: 'road', sortOrder: 5, isActive: 1 }
  ]);
  
  // Insert sample data sources using Drizzle
  await db.insert(sqliteSchema.dataSources).values([
    { name: 'US Census Bureau', description: 'Official US Census data', url: 'https://www.census.gov', isActive: 1 },
    { name: 'CDC', description: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov', isActive: 1 },
    { name: 'Bureau of Labor Statistics', description: 'Employment and economic data', url: 'https://www.bls.gov', isActive: 1 }
  ]);
  
  // Insert sample statistics using Drizzle
  await db.insert(sqliteSchema.statistics).values([
    { categoryId: 1, dataSourceId: 1, name: 'High School Graduation Rate', description: 'Percentage of students who graduate high school', unit: 'percentage', isActive: 1 },
    { categoryId: 1, dataSourceId: 1, name: 'College Enrollment Rate', description: 'Percentage of high school graduates who enroll in college', unit: 'percentage', isActive: 1 },
    { categoryId: 2, dataSourceId: 2, name: 'Life Expectancy', description: 'Average life expectancy at birth', unit: 'years', isActive: 1 },
    { categoryId: 2, dataSourceId: 2, name: 'Infant Mortality Rate', description: 'Deaths per 1,000 live births', unit: 'per 1,000', isActive: 1 },
    { categoryId: 3, dataSourceId: 3, name: 'Unemployment Rate', description: 'Percentage of labor force that is unemployed', unit: 'percentage', isActive: 1 },
    { categoryId: 3, dataSourceId: 3, name: 'Median Household Income', description: 'Median annual household income', unit: 'dollars', isActive: 1 }
  ]);
  
  // Insert sample import sessions using Drizzle
  await db.insert(sqliteSchema.importSessions).values([
    { name: '2023 Education Data Import', description: 'Education statistics for 2023', dataSourceId: 1, dataYear: 2023, recordCount: 500, isActive: 1 },
    { name: '2023 Healthcare Data Import', description: 'Healthcare statistics for 2023', dataSourceId: 2, dataYear: 2023, recordCount: 300, isActive: 1 },
    { name: '2023 Economic Data Import', description: 'Economic indicators for 2023', dataSourceId: 3, dataYear: 2023, recordCount: 400, isActive: 1 }
  ]);
  
  // Insert sample data points using Drizzle
  await db.insert(sqliteSchema.dataPoints).values([
    { importSessionId: 1, year: 2023, stateId: 1, statisticId: 1, value: 85.2 },
    { importSessionId: 1, year: 2023, stateId: 2, statisticId: 1, value: 82.1 },
    { importSessionId: 1, year: 2023, stateId: 3, statisticId: 1, value: 88.5 },
    { importSessionId: 1, year: 2023, stateId: 4, statisticId: 1, value: 84.7 },
    { importSessionId: 1, year: 2023, stateId: 5, statisticId: 1, value: 90.1 },
    { importSessionId: 2, year: 2023, stateId: 1, statisticId: 3, value: 75.2 },
    { importSessionId: 2, year: 2023, stateId: 2, statisticId: 3, value: 78.9 },
    { importSessionId: 2, year: 2023, stateId: 3, statisticId: 3, value: 80.1 },
    { importSessionId: 2, year: 2023, stateId: 4, statisticId: 3, value: 76.8 },
    { importSessionId: 2, year: 2023, stateId: 5, statisticId: 3, value: 82.3 },
    { importSessionId: 3, year: 2023, stateId: 1, statisticId: 5, value: 3.2 },
    { importSessionId: 3, year: 2023, stateId: 2, statisticId: 5, value: 4.1 },
    { importSessionId: 3, year: 2023, stateId: 3, statisticId: 5, value: 2.8 },
    { importSessionId: 3, year: 2023, stateId: 4, statisticId: 5, value: 3.5 },
    { importSessionId: 3, year: 2023, stateId: 5, statisticId: 5, value: 2.9 }
  ]);
  
  // Insert sample users for testing
  await db.insert(sqliteSchema.users).values([
    { email: 'test@example.com', name: 'Test User', role: 'user', isActive: 1, emailVerified: 1 },
    { email: 'admin@example.com', name: 'Admin User', role: 'admin', isActive: 1, emailVerified: 1 }
  ]);
  
  // Insert sample CSV import templates for testing
  await db.insert(sqliteSchema.csvImportTemplates).values([
    {
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
      createdBy: 1 // admin@example.com
    },
    {
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
      createdBy: 1 // admin@example.com
    }
  ]);
}

// Create a test database instance that will be shared
let sharedTestDb: any;

// Export function to set up database mock
export function setupDatabaseMock() {
  jest.mock('@/lib/db/index', () => {
    const mockDb = sharedTestDb || getTestDb();
    console.log('🔧 Database mock created with db:', mockDb ? 'exists' : 'null');
    return {
      db: mockDb,
    };
  });
}

// Mock the cache module for API tests (but not for cache tests)
if (!process.env.SKIP_CACHE_MOCK) {
  jest.mock('@/lib/services/cache', () => ({
    cache: {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
      getOptional: jest.fn(),
    },
  }));
}

// Clean up test database after all tests
afterAll(() => {
  cleanupTestDatabase();
});

// Export test utilities for use in individual test files
export { sqliteSchema }; 