import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Environment-based database configuration
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      // Use in-memory database for tests
      return {
        path: ':memory:',
        description: 'TEST (in-memory)'
      };
    case 'production':
      // Use production database
      return {
        path: path.join(process.cwd(), 'prod.db'),
        description: 'PRODUCTION'
      };
    case 'development':
    default:
      // Use development database
      return {
        path: path.join(process.cwd(), 'dev.db'),
        description: 'DEVELOPMENT'
      };
  }
};

const dbConfig = getDatabaseConfig();

// Create SQLite database connection with error handling
let sqlite: Database.Database;
try {
  sqlite = new Database(dbConfig.path);
  console.log(`✅ Database connected successfully: ${dbConfig.description} at: ${dbConfig.path}`);
} catch (error) {
  console.error(`❌ Failed to connect to database: ${dbConfig.description} at:`, dbConfig.path, error);
  throw new Error(`Database connection failed: ${error}`);
}

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for migrations
export { schema }; 