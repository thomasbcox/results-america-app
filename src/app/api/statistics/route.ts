import { NextRequest } from 'next/server';
import { StatisticsService } from '@/lib/services/statisticsService';
import { getStatisticsWithData } from '@/lib/services/dataAvailabilityService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleGetStatistics(request: NextRequest) {
  const url = new URL(request.url);
  const withAvailability = url.searchParams.get('withAvailability') === 'true';
  
  const statistics = await StatisticsService.getAllStatisticsWithSources();
  
  // Add data availability information if requested
  if (withAvailability) {
    const statisticsWithData = await getStatisticsWithData();
    const statisticsWithAvailability = statistics.map((statistic) => ({
      ...statistic,
      hasData: statisticsWithData.includes(statistic.id)
    }));
    return createSuccessResponse(statisticsWithAvailability);
  }
  
  return createSuccessResponse(statistics);
}

export const GET = withErrorHandling(handleGetStatistics); 