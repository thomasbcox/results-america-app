import { NextRequest, NextResponse } from 'next/server';
import { CategoriesService } from '@/lib/services/categoriesService';
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

async function handleGetCategories(request: NextRequest) {
  console.log('🚀 API /api/categories called with URL:', request.url);
  const url = new URL(request.url);
  let page = parseInt(url.searchParams.get('page') || '1');
  let limit = parseInt(url.searchParams.get('limit') || '50');
  const search = url.searchParams.get('search');
  const sortBy = url.searchParams.get('sortBy') || undefined;
  const sortOrder = (url.searchParams.get('sortOrder') as 'asc' | 'desc') || 'asc';
  const withStats = url.searchParams.get('withStats') === 'true';

  // Validate pagination params
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1 || limit > 1000) limit = 50;

  // Validate sort params
  const validSortFields = ['name', 'description', 'sortOrder', 'id'];
  if (sortBy && !validSortFields.includes(sortBy)) {
    return createBadRequestResponse('Invalid sortBy parameter');
  }
  if (sortOrder && sortOrder !== 'asc' && sortOrder !== 'desc') {
    return createBadRequestResponse('Invalid sortOrder parameter');
  }

  // Handle search
  if (search) {
    const results = await CategoriesService.searchCategories(search);
    return createSuccessResponse(results);
  }

  // Handle pagination
  if (page > 1 || limit !== 50) {
    const paginated = await CategoriesService.getCategoriesWithPagination(
      { page, limit },
      { sortBy, sortOrder }
    );
    return createSuccessResponse(paginated.data);
  }

  // Handle sorting without pagination
  if (sortBy) {
    const paginated = await CategoriesService.getCategoriesWithPagination(
      { page: 1, limit: 50 },
      { sortBy, sortOrder }
    );
    return createSuccessResponse(paginated.data);
  }

  // Handle withStats parameter
  if (withStats) {
    const categories = await CategoriesService.getCategoriesWithStatistics();
    return createSuccessResponse(categories);
  }

  // Default: return all categories
  const categories = await CategoriesService.getAllCategories();
  console.log('API /api/categories returning categories:', JSON.stringify(categories, null, 2));
  return createSuccessResponse(categories);
}

export const GET = withErrorHandling(handleGetCategories); 