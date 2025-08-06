import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/lib/services/statisticsService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

async function handleUpdateStatistic(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const statisticId = Number(params.id);
  
  if (isNaN(statisticId)) {
    return createBadRequestResponse('Invalid statistic ID');
  }

  try {
    const body = await request.json();
    const { preferenceDirection } = body;

    // Validate preference direction
    if (preferenceDirection && !['higher', 'lower', 'neutral'].includes(preferenceDirection)) {
      return createBadRequestResponse('Invalid preference direction');
    }

    // Update the statistic
    const updatedStatistic = await StatisticsService.updateStatistic(statisticId, {
      preferenceDirection
    });

    return createSuccessResponse({ data: updatedStatistic });
  } catch (error) {
    console.error('Failed to update statistic:', error);
    return createBadRequestResponse('Failed to update statistic');
  }
}

export const PATCH = withErrorHandling(handleUpdateStatistic); 