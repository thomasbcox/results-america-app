#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from '../src/lib/db/schema';

async function setupProductionDatabase() {
  console.log('🚀 Setting up production database...');

  try {
    // Create database connection
    const sqlite = new Database('dev.db');
    const db = drizzle(sqlite, { schema });

    // Check if we need to seed data
    const statsCount = await db.select().from(schema.statistics).limit(1);
    
    if (statsCount.length === 0) {
      console.log('🌱 Seeding database with initial data...');
      // Import and run seed function
      const { seedDatabase } = await import('../src/lib/db/seed');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
    } else {
      console.log('✅ Database already contains data, skipping seed');
    }

    console.log('🎉 Production database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up production database:', error);
    process.exit(1);
  }
}

setupProductionDatabase(); 