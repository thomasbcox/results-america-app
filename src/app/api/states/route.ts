import { NextRequest } from 'next/server';
import { StatesService } from '@/lib/services/statesService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleGetStates(request: NextRequest) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search');
  const sortBy = url.searchParams.get('sortBy') || undefined;
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

  // Handle search
  if (search) {
    const results = await StatesService.searchStates(search);
    return createSuccessResponse(results);
  }

  // Handle pagination
  if (page > 1 || limit !== 50) {
    const paginated = await StatesService.getStatesWithPagination(
      { page, limit },
      { sortBy, sortOrder }
    );
    return createSuccessResponse(paginated);
  }

  // Handle sorting without pagination
  if (sortBy) {
    const paginated = await StatesService.getStatesWithPagination(
      { page: 1, limit: 50 },
      { sortBy, sortOrder }
    );
    return createSuccessResponse(paginated.data);
  }

  // Default: return all states
  const states = await StatesService.getAllStates();
  return createSuccessResponse(states);
}

export const GET = withErrorHandling(handleGetStates); 