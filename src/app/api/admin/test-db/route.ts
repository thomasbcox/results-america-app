import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing database connection...');
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed - db is null'
      }, { status: 500 });
    }

    // Test a simple query
    const result = await db.execute('SELECT 1 as test');
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      test: result
    });
    
  } catch (error) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      error: `Database test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
