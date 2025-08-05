import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from '../db/schema';
import { join, dirname } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync, mkdirSync } from 'fs';
import { v4 as uuidv4 } from 'uuid';

/**
 * Bulletproof Test Database Infrastructure
 * 
 * This system ensures:
 * - Complete isolation between tests
 * - Proper foreign key constraint handling
 * - Deterministic test state
 * - Fast setup/teardown
 * - Support for both in-memory and file-based databases
 */

export interface TestDatabaseConfig {
  /** Use in-memory database for faster tests (default: true) */
  inMemory?: boolean;
  /** Enable foreign key constraints (default: true) */
  enableForeignKeys?: boolean;
  /** Enable WAL mode for better concurrency (default: true) */
  enableWAL?: boolean;
  /** Custom database path (only used if inMemory: false) */
  dbPath?: string;
  /** Enable verbose logging (default: false) */
  verbose?: boolean;
}

export interface TestDatabase {
  /** The Drizzle database instance */
  db: BetterSQLite3Database<typeof schema>;
  /** The underlying SQLite database */
  sqlite: Database.Database;
  /** Unique identifier for this test database */
  id: string;
  /** Database file path (if file-based) */
  path?: string;
  /** Configuration used to create this database */
  config: TestDatabaseConfig;
}

/**
 * Manages test database lifecycle with bulletproof isolation
 */
export class BulletproofTestDatabase {
  private static instances = new Map<string, TestDatabase>();
  private static defaultConfig: TestDatabaseConfig = {
    inMemory: true,
    enableForeignKeys: true,
    enableWAL: true,
    verbose: false
  };

  /**
   * Create a new test database with guaranteed isolation
   */
  static create(config: TestDatabaseConfig = {}): TestDatabase {
    const finalConfig = { ...this.defaultConfig, ...config };
    const id = uuidv4();
    
    if (this.instances.has(id)) {
      throw new Error(`Test database with ID ${id} already exists`);
    }

    const log = (message: string) => {
      if (finalConfig.verbose) {
        console.log(`[TestDB:${id}] ${message}`);
      }
    };

    log('Creating new test database');

    // Create database
    let sqlite: Database.Database;
    let dbPath: string | undefined;

    if (finalConfig.inMemory) {
      sqlite = new Database(':memory:');
      log('Using in-memory database');
    } else {
      dbPath = finalConfig.dbPath || this.generateDbPath(id);
      const dir = dirname(dbPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      sqlite = new Database(dbPath);
      log(`Using file-based database: ${dbPath}`);
    }

    // Configure database
    this.configureDatabase(sqlite, finalConfig);

    // Create schema
    this.createSchema(sqlite, finalConfig);

    const db = drizzle(sqlite, { schema });
    const testDb: TestDatabase = {
      db,
      sqlite,
      id,
      path: dbPath,
      config: finalConfig
    };

    this.instances.set(id, testDb);
    log('Test database created successfully');

    return testDb;
  }

  /**
   * Get an existing test database by ID
   */
  static get(id: string): TestDatabase | undefined {
    return this.instances.get(id);
  }

  /**
   * Destroy a test database and clean up resources
   */
  static destroy(testDb: TestDatabase): void {
    const log = (message: string) => {
      if (testDb.config.verbose) {
        console.log(`[TestDB:${testDb.id}] ${message}`);
      }
    };

    log('Destroying test database');

    try {
      // Close the database connection
      testDb.sqlite.close();
      log('Database connection closed');

      // Remove from instances map
      this.instances.delete(testDb.id);

      // Delete file if it exists
      if (testDb.path && existsSync(testDb.path)) {
        unlinkSync(testDb.path);
        log(`Database file deleted: ${testDb.path}`);
      }
    } catch (error) {
      log(`Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Don't throw - cleanup errors shouldn't fail tests
    }
  }

  /**
   * Destroy all test databases
   */
  static destroyAll(): void {
    const ids = Array.from(this.instances.keys());
    ids.forEach(id => {
      const testDb = this.instances.get(id);
      if (testDb) {
        this.destroy(testDb);
      }
    });
  }

  /**
   * Clear all data from a test database while preserving schema
   */
  static clearData(testDb: TestDatabase): void {
    const log = (message: string) => {
      if (testDb.config.verbose) {
        console.log(`[TestDB:${testDb.id}] ${message}`);
      }
    };

    log('Clearing all data from test database');

    try {
      // Disable foreign key constraints temporarily
      testDb.sqlite.pragma('foreign_keys = OFF');

      // Clear tables in dependency order (child tables first)
      const clearOrder = [
        'import_logs',
        'import_validation_summary',
        'csv_import_validation',
        'csv_import_metadata',
        'csv_import_staging',
        'csv_imports',
        'csv_import_templates',
        'data_points',
        'national_averages',
        'magic_links',
        'sessions',
        'user_favorites',
        'user_suggestions',
        'users',
        'import_sessions',
        'statistics',
        'data_sources',
        'categories',
        'states'
      ];

      clearOrder.forEach(tableName => {
        try {
          testDb.sqlite.prepare(`DELETE FROM ${tableName}`).run();
          log(`Cleared table: ${tableName}`);
        } catch (error) {
          // Table might not exist, which is fine
          log(`Table ${tableName} not found or already empty`);
        }
      });

      // Reset auto-increment counters
      testDb.sqlite.prepare('DELETE FROM sqlite_sequence').run();
      log('Reset auto-increment counters');

      // Re-enable foreign key constraints
      testDb.sqlite.pragma('foreign_keys = ON');
      log('Re-enabled foreign key constraints');

    } catch (error) {
      log(`Error clearing data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      // Re-enable foreign keys even if there was an error
      testDb.sqlite.pragma('foreign_keys = ON');
      throw error;
    }
  }

  /**
   * Seed the database with test data
   */
  static async seedData(testDb: TestDatabase, seedOptions: SeedOptions = {}): Promise<void> {
    const log = (message: string) => {
      if (testDb.config.verbose) {
        console.log(`[TestDB:${testDb.id}] ${message}`);
      }
    };

    log('Seeding test database');

    const {
      states = true,
      categories = true,
      dataSources = true,
      statistics = true,
      importSessions = true,
      dataPoints = true,
      users = true,
      csvTemplates = true
    } = seedOptions;

    try {
      if (states) {
        await this.seedStates(testDb);
      }
      if (categories) {
        await this.seedCategories(testDb);
      }
      if (dataSources) {
        await this.seedDataSources(testDb);
      }
      if (statistics) {
        await this.seedStatistics(testDb);
      }
      if (users) {
        await this.seedUsers(testDb);
      }
      if (importSessions) {
        await this.seedImportSessions(testDb);
      }
      if (dataPoints) {
        await this.seedDataPoints(testDb);
      }
      if (csvTemplates) {
        await this.seedCsvTemplates(testDb);
      }

      log('Test database seeded successfully');
    } catch (error) {
      log(`Error seeding data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }

  /**
   * Configure SQLite database settings
   */
  private static configureDatabase(sqlite: Database.Database, config: TestDatabaseConfig): void {
    // Enable foreign key constraints
    if (config.enableForeignKeys) {
      sqlite.pragma('foreign_keys = ON');
    }

    // Enable WAL mode for better concurrency
    if (config.enableWAL) {
      sqlite.pragma('journal_mode = WAL');
    }

    // Set synchronous mode for better performance in tests
    sqlite.pragma('synchronous = NORMAL');

    // Set cache size for better performance
    sqlite.pragma('cache_size = 10000');

    // Set temp store to memory for better performance
    sqlite.pragma('temp_store = MEMORY');
  }

  /**
   * Create database schema
   */
  private static createSchema(sqlite: Database.Database, config: TestDatabaseConfig): void {
    const log = (message: string) => {
      if (config.verbose) {
        console.log(`[Schema] ${message}`);
      }
    };

    // Create tables in dependency order
    const createTablesSQL = `
      -- States table
      CREATE TABLE IF NOT EXISTS states (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        abbreviation TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1
      );

      -- Categories table
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        icon TEXT,
        sort_order INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1
      );

      -- Data sources table
      CREATE TABLE IF NOT EXISTS data_sources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        url TEXT,
        is_active INTEGER DEFAULT 1
      );

      -- Statistics table
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
      );

      -- Import sessions table
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
      );

      -- Data points table
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
      );

      -- National averages table
      CREATE TABLE IF NOT EXISTS national_averages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        statistic_id INTEGER NOT NULL,
        year INTEGER NOT NULL,
        value REAL NOT NULL,
        calculation_method TEXT NOT NULL DEFAULT 'arithmetic_mean',
        state_count INTEGER NOT NULL,
        last_calculated INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (statistic_id) REFERENCES statistics(id),
        UNIQUE(statistic_id, year)
      );

      -- Users table
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL UNIQUE,
        name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active INTEGER NOT NULL DEFAULT 1,
        email_verified INTEGER NOT NULL DEFAULT 0,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      -- Sessions table
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id)
      );

      -- Magic links table
      CREATE TABLE IF NOT EXISTS magic_links (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expiresAt INTEGER NOT NULL,
        used INTEGER NOT NULL DEFAULT 0,
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
      );

      -- CSV imports table
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
      );

      -- CSV import staging table
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
      );

      -- CSV import templates table
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
      );

      -- CSV import metadata table
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
      );

      -- CSV import validation table
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
      );

      -- Import logs table
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
      );

      -- Import validation summary table
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
      );

      -- User favorites table
      CREATE TABLE IF NOT EXISTS user_favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        statistic_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (statistic_id) REFERENCES statistics(id),
        UNIQUE(user_id, statistic_id)
      );

      -- User suggestions table
      CREATE TABLE IF NOT EXISTS user_suggestions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category_id INTEGER,
        data_source_id INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (data_source_id) REFERENCES data_sources(id)
      );
    `;

    // Execute schema creation
    sqlite.exec(createTablesSQL);
    log('Database schema created successfully');
  }

  /**
   * Generate a unique database file path
   */
  private static generateDbPath(id: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    return join(tmpdir(), `bulletproof-test-${id}-${timestamp}-${randomId}.db`);
  }

  /**
   * Seed states data
   */
  private static async seedStates(testDb: TestDatabase): Promise<void> {
    const states = [
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
    ];

    await testDb.db.insert(schema.states).values(states);
  }

  /**
   * Seed categories data
   */
  private static async seedCategories(testDb: TestDatabase): Promise<void> {
    const categories = [
      { name: 'Education', description: 'Education statistics and metrics', icon: 'graduation-cap', sortOrder: 1, isActive: 1 },
      { name: 'Healthcare', description: 'Healthcare and medical statistics', icon: 'heart', sortOrder: 2, isActive: 1 },
      { name: 'Economy', description: 'Economic indicators and data', icon: 'trending-up', sortOrder: 3, isActive: 1 },
      { name: 'Environment', description: 'Environmental and climate data', icon: 'leaf', sortOrder: 4, isActive: 1 },
      { name: 'Infrastructure', description: 'Infrastructure and transportation', icon: 'road', sortOrder: 5, isActive: 1 }
    ];

    await testDb.db.insert(schema.categories).values(categories);
  }

  /**
   * Seed data sources data
   */
  private static async seedDataSources(testDb: TestDatabase): Promise<void> {
    const dataSources = [
      { name: 'US Census Bureau', description: 'Official US Census data', url: 'https://www.census.gov', isActive: 1 },
      { name: 'CDC', description: 'Centers for Disease Control and Prevention', url: 'https://www.cdc.gov', isActive: 1 },
      { name: 'Bureau of Labor Statistics', description: 'Employment and economic data', url: 'https://www.bls.gov', isActive: 1 }
    ];

    await testDb.db.insert(schema.dataSources).values(dataSources);
  }

  /**
   * Seed statistics data
   */
  private static async seedStatistics(testDb: TestDatabase): Promise<void> {
    const statistics = [
      { categoryId: 1, dataSourceId: 1, name: 'High School Graduation Rate', description: 'Percentage of students who graduate high school', unit: 'percentage', isActive: 1 },
      { categoryId: 1, dataSourceId: 1, name: 'College Enrollment Rate', description: 'Percentage of high school graduates who enroll in college', unit: 'percentage', isActive: 1 },
      { categoryId: 2, dataSourceId: 2, name: 'Life Expectancy', description: 'Average life expectancy at birth', unit: 'years', isActive: 1 },
      { categoryId: 2, dataSourceId: 2, name: 'Infant Mortality Rate', description: 'Deaths per 1,000 live births', unit: 'per 1,000', isActive: 1 },
      { categoryId: 3, dataSourceId: 3, name: 'Unemployment Rate', description: 'Percentage of labor force that is unemployed', unit: 'percentage', isActive: 1 },
      { categoryId: 3, dataSourceId: 3, name: 'Median Household Income', description: 'Median annual household income', unit: 'dollars', isActive: 1 }
    ];

    await testDb.db.insert(schema.statistics).values(statistics);
  }

  /**
   * Seed import sessions data
   */
  private static async seedImportSessions(testDb: TestDatabase): Promise<void> {
    const importSessions = [
      { name: '2023 Education Data Import', description: 'Education statistics for 2023', dataSourceId: 1, dataYear: 2023, recordCount: 500, isActive: 1 },
      { name: '2023 Healthcare Data Import', description: 'Healthcare statistics for 2023', dataSourceId: 2, dataYear: 2023, recordCount: 300, isActive: 1 },
      { name: '2023 Economic Data Import', description: 'Economic indicators for 2023', dataSourceId: 3, dataYear: 2023, recordCount: 400, isActive: 1 }
    ];

    await testDb.db.insert(schema.importSessions).values(importSessions);
  }

  /**
   * Seed data points data
   */
  private static async seedDataPoints(testDb: TestDatabase): Promise<void> {
    const dataPoints = [
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
    ];

    await testDb.db.insert(schema.dataPoints).values(dataPoints);
  }

  /**
   * Seed users data
   */
  private static async seedUsers(testDb: TestDatabase): Promise<void> {
    const users = [
      { email: 'test@example.com', name: 'Test User', role: 'user' as const, isActive: 1, emailVerified: 1 },
      { email: 'admin@example.com', name: 'Admin User', role: 'admin' as const, isActive: 1, emailVerified: 1 }
    ];

    await testDb.db.insert(schema.users).values(users);
  }

  /**
   * Seed CSV templates data
   */
  private static async seedCsvTemplates(testDb: TestDatabase): Promise<void> {
    const csvTemplates = [
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
        createdBy: 2 // admin@example.com
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
        createdBy: 2 // admin@example.com
      },
      {
        name: 'Multi Year Export',
        description: 'Import data from legacy system export format. Includes ID and foreign key columns that will be ignored.',
        templateSchema: JSON.stringify({
          expectedHeaders: ['ID', 'State', 'Year', 'Category', 'Measure Name', 'Value', 'state_id', 'category_id', 'measure_id']
        }),
        sampleData: `ID,State,Year,Category,Measure Name,Value,state_id,category_id,measure_id
1,Nation,2018,Economy,Net Job Growth,149148.6,1,1,15
2,Texas,2023,Economy,Net Job Growth,125000,1,2,15
3,California,2023,Economy,Net Job Growth,98000,2,2,15
4,Texas,2022,Economy,Net Job Growth,110000,1,2,15
5,California,2022,Economy,Net Job Growth,85000,2,2,15
6,Texas,2023,Education,Graduation Rate,89.1,1,1,8
7,California,2023,Education,Graduation Rate,85.2,2,1,8`,
        isActive: 1,
        createdBy: 2 // admin@example.com
      }
    ];

    await testDb.db.insert(schema.csvImportTemplates).values(csvTemplates);
  }
}

/**
 * Seed options for controlling what data to seed
 */
export interface SeedOptions {
  states?: boolean;
  categories?: boolean;
  dataSources?: boolean;
  statistics?: boolean;
  importSessions?: boolean;
  dataPoints?: boolean;
  users?: boolean;
  csvTemplates?: boolean;
}

/**
 * Test database factory for easy creation with common configurations
 */
export class TestDatabaseFactory {
  /**
   * Create a fast in-memory database for unit tests
   */
  static createFast(): TestDatabase {
    return BulletproofTestDatabase.create({
      inMemory: true,
      enableForeignKeys: true,
      enableWAL: false, // Disable WAL for faster in-memory tests
      verbose: false
    });
  }

  /**
   * Create a file-based database for integration tests
   */
  static createPersistent(): TestDatabase {
    return BulletproofTestDatabase.create({
      inMemory: false,
      enableForeignKeys: true,
      enableWAL: true,
      verbose: false
    });
  }

  /**
   * Create a verbose database for debugging
   */
  static createDebug(): TestDatabase {
    return BulletproofTestDatabase.create({
      inMemory: true,
      enableForeignKeys: true,
      enableWAL: false,
      verbose: true
    });
  }
}

/**
 * Jest test utilities for easy integration
 */
export const TestUtils = {
  /**
   * Create a test database and seed it with data
   */
  async createAndSeed(options: {
    config?: TestDatabaseConfig;
    seedOptions?: SeedOptions;
  } = {}): Promise<TestDatabase> {
    const testDb = BulletproofTestDatabase.create(options.config);
    await BulletproofTestDatabase.seedData(testDb, options.seedOptions);
    return testDb;
  },

  /**
   * Clean up all test databases (call in afterAll)
   */
  cleanup(): void {
    BulletproofTestDatabase.destroyAll();
  }
}; 