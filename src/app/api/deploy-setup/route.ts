import { NextRequest, NextResponse } from 'next/server';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import * as schema from '@/lib/db/schema-postgres';
import { createSuccessResponse, createInternalServerErrorResponse } from '@/lib/response';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Running Vercel deployment setup...');

    // Check if DATABASE_URL is available
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL environment variable is required');
      return createInternalServerErrorResponse('DATABASE_URL not configured');
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
      const { seedDatabase } = await import('@/lib/db/seed');
      await seedDatabase();
      console.log('✅ Database seeded successfully');
    } else {
      console.log('✅ Database already contains data, skipping seed');
    }

    // Close connection
    await client.end();

    console.log('🎉 Vercel deployment setup complete!');
    return createSuccessResponse({
      message: 'Deployment setup completed successfully',
      migrations: 'completed',
      seeding: statsCount.length === 0 ? 'completed' : 'skipped'
    });
  } catch (error) {
    console.error('❌ Error during Vercel deployment setup:', error);
    return createInternalServerErrorResponse(
      `Deployment setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
} 