#!/usr/bin/env tsx

import { SmartSeeder } from '../src/lib/services/smartSeeder';

async function main() {
  console.log('🚀 Starting smart database seeding...\n');

  try {
    // Seed all tables in dependency order
    const summary = await SmartSeeder.seedAll();

    console.log('\n📊 Seeding Summary:');
    console.log('===================');
    
    for (const result of summary.results) {
      console.log(`${result.table}:`);
      console.log(`  ✅ Created: ${result.created}`);
      console.log(`  🔄 Updated: ${result.updated}`);
      if (result.errors.length > 0) {
        console.log(`  ❌ Errors: ${result.errors.length}`);
        for (const error of result.errors) {
          console.log(`    - ${error}`);
        }
      }
      console.log('');
    }

    console.log(`📈 Totals:`);
    console.log(`  ✅ Total Created: ${summary.totalCreated}`);
    console.log(`  🔄 Total Updated: ${summary.totalUpdated}`);
    console.log(`  ❌ Total Errors: ${summary.totalErrors}`);

    if (summary.totalErrors === 0) {
      console.log('\n🎉 All seeding completed successfully!');
      process.exit(0);
    } else {
      console.log('\n⚠️  Seeding completed with errors. Check the output above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length === 0) {
  // Seed everything
  main();
} else {
  // Seed specific tables
  const table = args[0];
  console.log(`🌱 Seeding specific table: ${table}`);

  switch (table) {
    case 'states':
      SmartSeeder.seedStates().then(console.log).catch(console.error);
      break;
    case 'categories':
      SmartSeeder.seedCategories().then(console.log).catch(console.error);
      break;
    case 'data-sources':
      SmartSeeder.seedDataSources().then(console.log).catch(console.error);
      break;
    case 'statistics':
      SmartSeeder.seedStatistics().then(console.log).catch(console.error);
      break;
    case 'data-points':
      SmartSeeder.seedDataPoints().then(console.log).catch(console.error);
      break;
    case 'national-averages':
      SmartSeeder.seedNationalAverages().then(console.log).catch(console.error);
      break;
    default:
      console.error(`❌ Unknown table: ${table}`);
      console.log('Available tables: states, categories, data-sources, statistics, data-points, national-averages');
      process.exit(1);
  }
} 