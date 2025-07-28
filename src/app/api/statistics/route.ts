import { NextRequest, NextResponse } from 'next/server';
import { StatisticsService } from '@/lib/services/statisticsService';
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

async function handleGetStatistics(request: NextRequest) {
  console.log('🚀 API /api/statistics called with URL:', request.url);
  const url = new URL(request.url);
  let page = parseInt(url.searchParams.get('page') || '1');
  let limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search');
  const sortBy = url.searchParams.get('sortBy') || undefined;
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
  const categoryId = url.searchParams.get('categoryId');
  const withAvailability = url.searchParams.get('withAvailability') === 'true';

  // Validate pagination params
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 1000) limit = 50;

  // Validate sort params
  const validSortFields = ['name', 'description', 'unit', 'categoryId', 'id'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return createBadRequestResponse('Invalid sortBy parameter');
  }
  if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
    return createBadRequestResponse('Invalid sortOrder parameter');
  }

  // Validate categoryId
  if (categoryId && isNaN(parseInt(categoryId))) {
    return createBadRequestResponse('Invalid categoryId parameter');
  }

  // Handle search
  if (search) {
    const results = await StatisticsService.searchStatistics(search);
    return createSuccessResponse(results);
  }

  // Handle category filtering
  if (categoryId) {
    const results = await StatisticsService.getStatisticsByCategory(parseInt(categoryId));
    return createSuccessResponse(results);
  }

  // Handle pagination
  if (page > 1 || limit !== 50) {
    const paginated = await StatisticsService.getStatisticsWithPagination(
      { page, limit },
      { sortBy, sortOrder }
    );
    return createSuccessResponse(paginated.data);
  }

  // Handle sorting without pagination
  if (sortBy) {
    const paginated = await StatisticsService.getStatisticsWithPagination(
      { page: 1, limit: 50 },
      { sortBy, sortOrder }
    );
    return createSuccessResponse(paginated.data);
  }

  // Handle withAvailability parameter
  if (withAvailability) {
    const statistics = await StatisticsService.getStatisticsWithAvailability();
    return createSuccessResponse(statistics);
  }

  // Default: return all statistics
  const statistics = await StatisticsService.getAllStatistics();
  console.log('API /api/statistics returning statistics:', JSON.stringify(statistics, null, 2));
  return createSuccessResponse(statistics);
}

export const GET = withErrorHandling(handleGetStatistics); 