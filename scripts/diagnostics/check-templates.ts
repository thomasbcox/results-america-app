#!/usr/bin/env tsx

import { getDb } from '../../src/lib/db/index';
import { csvImportTemplates } from '../../src/lib/db/schema-postgres';

async function checkTemplates() {
  const db = getDb();
  if (!db) {
    throw new Error('Database not available');
  }
  console.log('🔍 Checking CSV templates in database...');

  try {
    const templates = await db.select().from(csvImportTemplates);
    console.log('📋 Found templates:', templates.length);
    
    for (const template of templates) {
      console.log('  -', {
        id: template.id,
        name: template.name,
        description: template.description,
        isActive: template.isActive
      });
    }

  } catch (error) {
    console.error('❌ Error checking templates:', error);
    throw error;
  }
}

checkTemplates()
  .then(() => {
    console.log('🎉 Template check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Template check failed:', error);
    process.exit(1);
  }); 