import { NextResponse } from 'next/server';
import { getAnalyticsData } from '@/lib/services/adminService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '24h';
    
    const analytics = await getAnalyticsData(range);
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
} 