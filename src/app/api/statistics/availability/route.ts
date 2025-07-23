import { NextResponse } from 'next/server';
import { getStatisticsWithData } from '@/lib/services/dataAvailabilityService';

export async function GET() {
  try {
    const statisticsWithData = await getStatisticsWithData();
    
    return NextResponse.json({
      statisticsWithData,
      totalStatistics: statisticsWithData.length
    });
  } catch (error) {
    console.error('Error fetching statistics with data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics with data' },
      { status: 500 }
    );
  }
} 