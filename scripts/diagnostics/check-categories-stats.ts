#!/usr/bin/env tsx

import { getDb } from '../../src/lib/db';
import { categories, statistics } from '../../src/lib/db/schema-postgres';

async function checkCategoriesAndStats() {
  const db = getDb();  console.log('📊 Checking categories and statistics...');
  
  try {
    const allCategories = await db.select().from(categories);
    console.log(`✅ Found ${allCategories.length} categories:`);
    
    for (const category of allCategories) {
      console.log(`   - ID: ${category.id}, Name: ${category.name}`);
    }
    
    const allStatistics = await db.select().from(statistics);
    console.log(`\n✅ Found ${allStatistics.length} statistics:`);
    
    for (const stat of allStatistics) {
      console.log(`   - ID: ${stat.id}, Name: ${stat.name}, Category ID: ${stat.categoryId}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking categories and statistics:', error);
  }
}

checkCategoriesAndStats()
  .then(() => {
    console.log('✅ Categories and statistics check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  }); 