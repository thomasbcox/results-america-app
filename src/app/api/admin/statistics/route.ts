import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/lib/services/statisticsService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

async function handleGetStatistics(request: NextRequest) {
  const url = new URL(request.url);
  const search = url.searchParams.get('search');
  const categoryId = url.searchParams.get('categoryId');

  try {
    let statistics;
    
    if (search) {
      statistics = await StatisticsService.searchStatistics(search);
    } else if (categoryId) {
      statistics = await StatisticsService.getStatisticsByCategory(Number(categoryId));
    } else {
      statistics = await StatisticsService.getAllStatisticsWithSources();
    }

    return createSuccessResponse({ data: statistics });
  } catch (error) {
    console.error('Failed to fetch statistics:', error);
    return createBadRequestResponse('Failed to fetch statistics');
  }
}

export const GET = withErrorHandling(handleGetStatistics); 