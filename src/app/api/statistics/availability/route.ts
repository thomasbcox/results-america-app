import { NextRequest } from 'next/server';
import { getStatisticsWithData } from '@/lib/services/dataAvailabilityService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleStatisticsAvailabilityRequest(request: NextRequest) {
  const statisticsWithData = await getStatisticsWithData();
  return createSuccessResponse({ data: statisticsWithData });
}

export const GET = withErrorHandling(handleStatisticsAvailabilityRequest); 