import { NextRequest, NextResponse } from 'next/server';
import { seedVercelDatabase } from '../../../../../scripts/vercel-seed';

export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check
    // const user = await getCurrentUser(request);
    // if (!user || user.role !== 'admin') {
    //   return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    // }

    console.log('🌱 Admin seeding triggered via API...');
    const result = await seedVercelDatabase();
    
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
    console.error('❌ API seeding error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 