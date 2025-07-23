import { NextResponse } from 'next/server';
import { getAllStatisticsWithSources } from '@/lib/services/statisticsService';
import { getStatisticsWithData } from '@/lib/services/dataAvailabilityService';
import { isDatabaseError, isValidationError } from '@/lib/errors';
import type { StatisticData } from '@/types/api';

export async function GET(request: Request) {
  try {
    const url = new URL(request?.url || '');
    const withAvailability = url.searchParams.get('withAvailability') === 'true';
    
    const statistics = await getAllStatisticsWithSources();
    
    // Add data availability information if requested
    if (withAvailability) {
      const statisticsWithData = await getStatisticsWithData();
      const statisticsWithAvailability = statistics.map((statistic) => ({
        ...statistic,
        hasData: statisticsWithData.includes(statistic.id)
      }));
      return NextResponse.json(statisticsWithAvailability);
    }
    
    return NextResponse.json(statistics);
  } catch (error) {
    console.error('Error fetching statistics:', error);
    
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          code: 'DATABASE_ERROR',
          details: { code: error.code }
        },
        { status: 503 }
      );
    }
    
    if (isValidationError(error)) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: { field: error.field, value: error.value }
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 