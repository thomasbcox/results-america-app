import { NextRequest, NextResponse } from 'next/server';
import { seedProductionDatabasePostgres } from '../../../../../scripts/production-seed-postgres';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    console.log('🌱 Full production seeding triggered via API...');
    const result = await seedProductionDatabasePostgres();
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        details: result.details
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.message
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ API full seeding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}
