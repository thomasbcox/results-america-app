import { NextRequest } from 'next/server';
import { getCategoriesWithData } from '@/lib/services/dataAvailabilityService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleCategoriesAvailabilityRequest(request: NextRequest) {
  const categoriesWithData = await getCategoriesWithData();
  return createSuccessResponse(categoriesWithData);
}

export const GET = withErrorHandling(handleCategoriesAvailabilityRequest); 