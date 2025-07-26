#!/usr/bin/env tsx

import { seedDatabaseNormalized } from '../src/lib/db/seed-normalized';

async function deploySeed() {
  console.log('🚀 Starting production database seeding...');
  
  try {
    // Seed the database
    await seedDatabaseNormalized();
    console.log('✅ Database seeded successfully');
    
    console.log('🎉 Production deployment complete!');
  } catch (error) {
    console.error('❌ Error during production deployment:', error);
    process.exit(1);
  }
}

deploySeed(); 