import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as postgresSchema from './schema-postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment-based database configuration
const getDatabaseConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
      // For tests, we'll use a mock database or skip if not available
      return {
        type: 'mock' as const,
        description: 'TEST (Mock Database)'
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

// Lazy database connection
let databaseInstance: ReturnType<typeof drizzlePostgres> | null = null;
let dbInitialized = false;

const initializeDatabase = () => {
  if (dbInitialized) {
    return databaseInstance;
  }

  try {
    const dbConfig = getDatabaseConfig();
    
    if (dbConfig.type === 'mock') {
      // Return null for tests - they should use testDb.ts
      console.log(`✅ Mock database for tests: ${dbConfig.description}`);
      databaseInstance = null;
      dbInitialized = true;
      return databaseInstance;
    } else {
      // PostgreSQL for dev/prod
      if (!dbConfig.url) {
        // In build mode, don't throw error, just return null
        if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
          console.warn('⚠️ DATABASE_URL not set during build - database will be initialized at runtime');
          databaseInstance = null;
          dbInitialized = true;
          return databaseInstance;
        }
        throw new Error('DATABASE_URL environment variable is required for PostgreSQL');
      }
      
      const client = postgres(dbConfig.url, {
        max: 10, // Use connection pooling
        ssl: 'require', // Neon requires SSL
        idle_timeout: 20, // Close idle connections
        connect_timeout: 10, // Connection timeout
      });
      
      databaseInstance = drizzlePostgres(client, { schema: postgresSchema });
      console.log(`✅ PostgreSQL database connected: ${dbConfig.description}`);
    }
    
    dbInitialized = true;
    return databaseInstance;
  } catch (error) {
    console.error(`❌ Failed to connect to database`, error);
    // In build mode, don't throw error
    if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
      console.warn('⚠️ Database connection failed during build - will retry at runtime');
      databaseInstance = null;
      dbInitialized = true;
      return databaseInstance;
    }
    throw new Error(`Database connection failed: ${error}`);
  }
};

// Export a function that gets the database instance
export const getDb = () => {
  // During build time, return null to prevent build failures
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    console.warn('⚠️ Database not available during build - returning null');
    return null;
  }
  
  if (!dbInitialized) {
    return initializeDatabase();
  }
  return databaseInstance;
};

// For backward compatibility, export db as a getter function
export const db = getDb;

// Export schemas for migrations
export { postgresSchema }; 