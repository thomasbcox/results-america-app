import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

// Get the absolute path to the database file
const dbPath = path.join(process.cwd(), 'dev.db');

// Create SQLite database connection with error handling
let sqlite: Database.Database;
try {
  sqlite = new Database(dbPath);
  console.log('✅ Database connected successfully at:', dbPath);
} catch (error) {
  console.error('❌ Failed to connect to database at:', dbPath, error);
  throw new Error(`Database connection failed: ${error}`);
}

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for migrations
export { schema }; 