import { NextRequest } from 'next/server';
import { getDataPointsForState, getDataPointsForStatistic, getDataPointsForComparison } from '@/lib/services/dataPointsService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleGetDataPoints(request: NextRequest) {
  const url = new URL(request.url);
  const stateId = url.searchParams.get('stateId');
  const statisticId = url.searchParams.get('statisticId');
  const year = url.searchParams.get('year');
  const stateIds = url.searchParams.get('stateIds');
  const statisticIds = url.searchParams.get('statisticIds');

  let dataPoints;

  if (stateId) {
    dataPoints = await getDataPointsForState(
      parseInt(stateId), 
      year ? parseInt(year) : undefined
    );
  } else if (statisticId) {
    dataPoints = await getDataPointsForStatistic(
      parseInt(statisticId), 
      year ? parseInt(year) : undefined
    );
  } else if (stateIds && statisticIds && year) {
    const stateIdArray = stateIds.split(',').map(id => parseInt(id));
    const statisticIdArray = statisticIds.split(',').map(id => parseInt(id));
    dataPoints = await getDataPointsForComparison(
      stateIdArray, 
      statisticIdArray, 
      parseInt(year)
    );
  } else {
    throw new Error('Missing required parameters. Use stateId, statisticId, or both stateIds and statisticIds with year');
  }

  return createSuccessResponse(dataPoints);
}

export const GET = withErrorHandling(handleGetDataPoints); 