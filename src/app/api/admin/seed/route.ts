import { NextResponse } from 'next/server';
import { seedDatabaseNormalized } from '@/lib/db/seed-normalized';

export async function POST() {
  try {
    console.log('🌱 Starting database seeding from admin API...');
    
    await seedDatabaseNormalized();
    
    console.log('✅ Database seeding completed successfully from admin API');
    
    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error seeding database from admin API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during seeding',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 