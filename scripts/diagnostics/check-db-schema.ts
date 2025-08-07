import { getDb } from '../../src/lib/db';

async function checkSchema() {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if csv_imports table exists and get its structure
    const result = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'csv_imports' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 CSV Imports Table Structure:');
    console.log('Column Name | Data Type | Nullable | Default');
    console.log('------------|-----------|----------|---------');
    
    if (result && Array.isArray(result)) {
      for (const row of result) {
        console.log(`${row.column_name} | ${row.data_type} | ${row.is_nullable} | ${row.column_default || 'NULL'}`);
      }
    } else {
      console.log('No csv_imports table found or error accessing it');
    }
    
    // Check if import_logs table exists
    const logsResult = await db.execute(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'import_logs' 
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Import Logs Table Structure:');
    console.log('Column Name | Data Type | Nullable | Default');
    console.log('------------|-----------|----------|---------');
    
    if (logsResult && Array.isArray(logsResult)) {
      for (const row of logsResult) {
        console.log(`${row.column_name} | ${row.data_type} | ${row.is_nullable} | ${row.column_default || 'NULL'}`);
      }
    } else {
      console.log('No import_logs table found or error accessing it');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error);
  }
}

checkSchema(); 