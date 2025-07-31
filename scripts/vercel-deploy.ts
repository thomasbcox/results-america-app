#!/usr/bin/env tsx

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '../src/lib/db/schema-postgres';

async function setupVercelDatabase() {
  console.log('🚀 Setting up Vercel production database...');

  try {
    // Check if DATABASE_URL is available
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is required');
      process.exit(1);
    }

    // Create database connection
    const client = postgres(databaseUrl, {
      max: 1, // Use minimal connections for serverless
      ssl: 'require',
      idle_timeout: 20,
      connect_timeout: 10,
    });
    
    const db = drizzle(client, { schema });

    // Run migrations
    console.log('📦 Running database migrations...');
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('✅ Migrations completed');

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

    // Close connection
    await client.end();

    console.log('🎉 Vercel database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up Vercel database:', error);
    process.exit(1);
  }
}

setupVercelDatabase(); 