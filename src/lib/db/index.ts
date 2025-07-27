import { drizzle } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import Database from 'better-sqlite3';
import postgres from 'postgres';
import * as sqliteSchema from './schema';
import * as postgresSchema from './schema-postgres';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment-based database configuration
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      // Use file-based SQLite for tests (shared across processes)
      const testDbPath = process.env.TEST_DB_PATH || ':memory:';
      return {
        type: 'sqlite' as const,
        path: testDbPath,
        description: 'TEST (file-based SQLite)'
      };
    case 'production':
      // Use PostgreSQL for production (cloud database)
      return {
        type: 'postgres' as const,
        url: process.env.DATABASE_URL,
        description: 'PRODUCTION (PostgreSQL)'
      };
    case 'development':
    default:
      // Use PostgreSQL for development (local or cloud)
      return {
        type: 'postgres' as const,
        url: process.env.DATABASE_URL || process.env.DEV_DATABASE_URL,
        description: 'DEVELOPMENT (PostgreSQL)'
      };
  }
};

// Create database connection based on type
let db: any;

try {
  const dbConfig = getDatabaseConfig();
  
  if (dbConfig.type === 'sqlite') {
    // SQLite for tests
    const sqlite = new Database(dbConfig.path);
    db = drizzle(sqlite, { schema: sqliteSchema });
    console.log(`✅ SQLite database connected: ${dbConfig.description}`);
  } else {
    // PostgreSQL for dev/prod
    if (!dbConfig.url) {
      throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
    }
    
    const client = postgres(dbConfig.url, {
      max: 1, // Use connection pooling
      ssl: 'require', // Neon requires SSL
    });
    
    db = drizzlePostgres(client, { schema: postgresSchema });
    console.log(`✅ PostgreSQL database connected: ${dbConfig.description}`);
  }
} catch (error) {
  console.error(`❌ Failed to connect to database`, error);
  throw new Error(`Database connection failed: ${error}`);
}

// Export the database instance
export { db };

// Export schemas for migrations
export { sqliteSchema, postgresSchema }; 