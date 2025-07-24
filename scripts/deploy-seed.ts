#!/usr/bin/env tsx

import { seedDatabaseNormalized } from '../src/lib/db/seed-normalized';
import { getSystemStats } from '../src/lib/services/adminService';

async function deploySeed() {
  console.log('🚀 Starting production database seeding...');
  
  try {
    // Check if database already has data
    const stats = await getSystemStats();
    
    if (stats.totalDataPoints > 0) {
      console.log('⚠️  Database already contains data:');
      console.log(`   - ${stats.totalStates} states`);
      console.log(`   - ${stats.totalCategories} categories`);
      console.log(`   - ${stats.totalStatistics} statistics`);
      console.log(`   - ${stats.totalDataPoints.toLocaleString()} data points`);
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question('Do you want to proceed with seeding anyway? This will add duplicate data. (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('❌ Seeding cancelled by user');
        process.exit(0);
      }
    }
    
    // Perform seeding
    await seedDatabaseNormalized();
    
    // Verify seeding was successful
    const newStats = await getSystemStats();
    console.log('✅ Production seeding completed successfully!');
    console.log('📊 Final database state:');
    console.log(`   - ${newStats.totalStates} states`);
    console.log(`   - ${newStats.totalCategories} categories`);
    console.log(`   - ${newStats.totalStatistics} statistics`);
    console.log(`   - ${newStats.totalDataPoints.toLocaleString()} data points`);
    console.log(`   - ${newStats.totalDataSources} data sources`);
    console.log(`   - ${newStats.totalImportSessions} import sessions`);
    
    if (newStats.lastImportDate) {
      console.log(`   - Last import: ${new Date(newStats.lastImportDate).toLocaleString()}`);
    }
    
    console.log('\n🎉 Your Results America application is now ready for production use!');
    console.log('   You can access the admin dashboard at: /admin');
    console.log('   Main application is available at: /');
    
  } catch (error) {
    console.error('❌ Error during production seeding:', error);
    process.exit(1);
  }
}

// Run the deployment seeding
deploySeed(); 