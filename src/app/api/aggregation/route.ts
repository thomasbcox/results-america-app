import { NextRequest } from 'next/server';
import { validateQueryParams, AggregationQuerySchema } from '@/lib/validators';
import { AggregationService } from '@/lib/services/aggregationService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleAggregationRequest(request: NextRequest) {
  const url = new URL(request.url);
  const params = validateQueryParams(AggregationQuerySchema, url.searchParams);
  
  const result = await AggregationService.aggregate(params);
  
  return createSuccessResponse(result);
}

export const GET = withErrorHandling(handleAggregationRequest); 