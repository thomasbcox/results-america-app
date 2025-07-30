import { NextRequest } from 'next/server';
import { z } from 'zod';
import { DataPointsService } from '@/lib/services/dataPointsService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

async function handleGetDataPoints(request: NextRequest) {
  const url = new URL(request.url);
  const stateId = url.searchParams.get('stateId');
  const statisticId = url.searchParams.get('statisticId');
  const year = url.searchParams.get('year');
  const stateIds = url.searchParams.get('stateIds');
  const statisticIds = url.searchParams.get('statisticIds');

  // Validate parameters
  if (!stateId && !statisticId && (!stateIds || !statisticIds || !year)) {
    return createBadRequestResponse('Missing required parameters. Use stateId, statisticId, or both stateIds and statisticIds with year');
  }

  // Validate numeric parameters
  if (stateId && isNaN(parseInt(stateId))) {
    return createBadRequestResponse('Invalid stateId parameter');
  }

  if (statisticId && isNaN(parseInt(statisticId))) {
    return createBadRequestResponse('Invalid statisticId parameter');
  }

  if (year && isNaN(parseInt(year))) {
    return createBadRequestResponse('Invalid year parameter');
  }

  let dataPoints;

  try {
    if (stateId) {
      dataPoints = await DataPointsService.getDataPointsForState(
        parseInt(stateId), 
        year ? parseInt(year) : undefined
      );
    } else if (statisticId) {
      dataPoints = await DataPointsService.getDataPointsForStatistic(
        parseInt(statisticId), 
        year ? parseInt(year) : undefined
      );
    } else if (stateIds && statisticIds && year) {
      const stateIdArray = stateIds.split(',').map(id => parseInt(id));
      const statisticIdArray = statisticIds.split(',').map(id => parseInt(id));
      
      // Validate array parameters
      if (stateIdArray.some(isNaN) || statisticIdArray.some(isNaN)) {
        return createBadRequestResponse('Invalid stateIds or statisticIds parameters');
      }
      
      dataPoints = await DataPointsService.getDataPointsForComparison(
        stateIdArray, 
        statisticIdArray, 
        parseInt(year)
      );
    } else {
      return createBadRequestResponse('Missing required parameters. Use stateId, statisticId, or both stateIds and statisticIds with year');
    }

    return createSuccessResponse(dataPoints);
  } catch (error) {
    console.error('Data points API error:', error);
    return createBadRequestResponse('Failed to retrieve data points');
  }
}

export const GET = withErrorHandling(handleGetDataPoints); 