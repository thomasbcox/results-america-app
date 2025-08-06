import { NextRequest } from 'next/server';
import { StatisticsService } from '@/lib/services/statisticsService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

async function handleRankingsRequest(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(request.url);
  
  // Parse query parameters
  const year = parseInt(url.searchParams.get('year') || '2022');
  const order = (url.searchParams.get('order') as 'asc' | 'desc') || 'desc';
  const limit = parseInt(url.searchParams.get('limit') || '3');
  
  // Validate parameters
  if (isNaN(parseInt(id))) {
    return createBadRequestResponse('Invalid statistic ID');
  }
  
  if (isNaN(year) || year < 1900 || year > 2030) {
    return createBadRequestResponse('Invalid year parameter');
  }
  
  if (order !== 'asc' && order !== 'desc') {
    return createBadRequestResponse('Invalid order parameter. Must be "asc" or "desc"');
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return createBadRequestResponse('Invalid limit parameter. Must be between 1 and 100');
  }
  
  try {
    const rankingsData = await StatisticsService.getStatisticRankings(parseInt(id), year, order);
    
    // Apply limit if specified
    const limitedRankings = limit ? rankingsData.rankings.slice(0, limit) : rankingsData.rankings;
    
    return createSuccessResponse({
      statistic: rankingsData.statistic,
      year: rankingsData.year,
      order,
      rankings: limitedRankings,
      totalRankings: rankingsData.rankings.length,
      hasMore: limit < rankingsData.rankings.length
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return createBadRequestResponse('Statistic not found');
    }
    throw error;
  }
}

export const GET = withErrorHandling(handleRankingsRequest); 