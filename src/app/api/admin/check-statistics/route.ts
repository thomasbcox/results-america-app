import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { statistics } from '@/lib/db/schema-postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking statistics table...');
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed - db is null'
      }, { status: 500 });
    }

    // Check if statistics table has any data
    const stats = await db.select().from(statistics).limit(10);
    
    return NextResponse.json({
      success: true,
      message: 'Statistics table check completed',
      count: stats.length,
      statistics: stats
    });
    
  } catch (error) {
    console.error('❌ Statistics check error:', error);
    return NextResponse.json({
      success: false,
      error: `Statistics check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
