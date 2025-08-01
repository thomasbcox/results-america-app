import { NextRequest } from 'next/server';
import { AggregationQuerySchema } from '@/lib/validators';
import { AggregationService } from '@/lib/services/aggregationService';
import { withErrorHandling, createSuccessResponse, validateQueryParams } from '@/lib/response';

async function handleAggregationRequest(request: NextRequest) {
  const params = validateQueryParams(AggregationQuerySchema, request.nextUrl.searchParams);
  const result = await AggregationService.aggregate(params as any);
  return createSuccessResponse(result);
}

export const GET = withErrorHandling(handleAggregationRequest); 