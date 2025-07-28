import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Load environment variables
config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const client = postgres(connectionString);
const db = drizzle(client);

async function addDuplicateOfColumn() {
  try {
    console.log('Adding duplicate_of column to csv_imports table...');
    
    // Add the duplicateOf column
    await client`
      ALTER TABLE csv_imports 
      ADD COLUMN IF NOT EXISTS duplicate_of INTEGER REFERENCES csv_imports(id)
    `;
    
    console.log('✅ Successfully added duplicate_of column to csv_imports table');
    
    // Verify the column was added
    const result = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'csv_imports' AND column_name = 'duplicate_of'
    `;
    
    if (result.length > 0) {
      console.log('✅ Column verification successful');
    } else {
      console.log('❌ Column verification failed');
    }
    
  } catch (error) {
    console.error('❌ Error adding duplicate_of column:', error);
  } finally {
    await client.end();
  }
}

addDuplicateOfColumn(); 