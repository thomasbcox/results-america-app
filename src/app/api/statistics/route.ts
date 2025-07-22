import { NextResponse } from 'next/server';
import { getAllStatisticsWithSources } from '@/lib/services/statisticsService';

export async function GET(request?: Request) {
  try {
    const statistics = await getAllStatisticsWithSources();
    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 