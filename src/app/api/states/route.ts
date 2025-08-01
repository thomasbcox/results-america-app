import { NextRequest, NextResponse } from 'next/server';
import { StatesService } from '@/lib/services/statesService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

function getDefaultPagination(total: number, page: number = 1, limit: number = 50) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

async function handleGetStates(request: NextRequest) {
  // Debug log to see if API route is being called
  // eslint-disable-next-line no-console
  console.log('🚀 API /api/states called with URL:', request.url);
  
  const url = new URL(request.url);
  let page = parseInt(url.searchParams.get('page') || '1');
  let limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search');
  const sortBy = url.searchParams.get('sortBy') || undefined;
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';

  // Validate pagination params
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 1000) limit = 50;

  // Validate sort params
  const validSortFields = ['name', 'abbreviation', 'id'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return createBadRequestResponse('Invalid sortBy parameter');
  }
  if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
    return createBadRequestResponse('Invalid sortOrder parameter');
  }

  // Handle search
  if (search) {
    const results = await StatesService.searchStates(search);
    // Filter out "Nation" from search results for user displays
    const filteredResults = results.filter(state => state.name !== 'Nation');
    return createSuccessResponse({ data: filteredResults });
  }

  // Handle pagination
  if (page > 1 || limit !== 50) {
    const paginated = await StatesService.getStatesWithPagination(
      { page, limit },
      { sortBy, sortOrder }
    );
    // Filter out "Nation" from paginated results for user displays
    const filteredData = paginated.data.filter(state => state.name !== 'Nation');
    return createSuccessResponse({ data: filteredData });
  }

  // Handle sorting without pagination
  if (sortBy) {
    const paginated = await StatesService.getStatesWithPagination(
      { page: 1, limit: 50 },
      { sortBy, sortOrder }
    );
    // Filter out "Nation" from sorted results for user displays
    const filteredData = paginated.data.filter(state => state.name !== 'Nation');
    return createSuccessResponse({ data: filteredData });
  }

  // Default: return all states (excluding "Nation" for user displays)
  const states = await StatesService.getDisplayStates();
  // Debug log
  // eslint-disable-next-line no-console
  console.log('API /api/states returning states:', JSON.stringify(states, null, 2));
  return createSuccessResponse({ data: states });
}

export const GET = withErrorHandling(handleGetStates); 