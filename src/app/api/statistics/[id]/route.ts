import { NextRequest, NextResponse } from 'next/server';
import { getStatisticById } from '@/lib/services/statisticsService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const statisticId = parseInt(id);
    
    if (isNaN(statisticId)) {
      return NextResponse.json(
        { error: 'Invalid statistic ID' },
        { status: 400 }
      );
    }
    
    const statistic = await getStatisticById(statisticId);
    
    if (!statistic) {
      return NextResponse.json(
        { error: 'Statistic not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(statistic);
  } catch (error) {
    console.error('Error fetching statistic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistic' },
      { status: 500 }
    );
  }
} 