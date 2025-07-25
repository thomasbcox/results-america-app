import { NextRequest } from 'next/server';
import { CategoriesService } from '@/lib/services/categoriesService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleGetCategories(request: NextRequest) {
  const url = new URL(request.url);
  const withStatistics = url.searchParams.get('withStatistics') === 'true';
  
  const categories = withStatistics 
    ? await CategoriesService.getCategoriesWithStatistics()
    : await CategoriesService.getAllCategories();
  
  return createSuccessResponse(categories);
}

export const GET = withErrorHandling(handleGetCategories); 