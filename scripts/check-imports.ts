#!/usr/bin/env tsx

import { db } from '../src/lib/db/index';
import { csvImports, csvImportStaging, csvImportMetadata } from '../src/lib/db/schema-postgres';

async function checkImports() {
  console.log('🔍 Checking CSV imports in database...');

  try {
    // Check imports
    const imports = await db.select().from(csvImports);
    console.log('📋 Found imports:', imports.length);
    
    for (const imp of imports) {
      console.log('  -', {
        id: imp.id,
        name: imp.name,
        filename: imp.filename,
        status: imp.status,
        uploadedAt: imp.uploadedAt,
        uploadedBy: imp.uploadedBy
      });
    }

    // Check staging data
    const staging = await db.select().from(csvImportStaging);
    console.log('📊 Found staging records:', staging.length);

    // Check metadata
    const metadata = await db.select().from(csvImportMetadata);
    console.log('📝 Found metadata records:', metadata.length);

  } catch (error) {
    console.error('❌ Error checking imports:', error);
    throw error;
  }
}

checkImports()
  .then(() => {
    console.log('🎉 Import check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Import check failed:', error);
    process.exit(1);
  }); 