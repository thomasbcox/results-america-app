import { NextRequest } from 'next/server';
import { getAllCategories, getCategoriesWithStatistics } from '@/lib/services/categoriesService';
import { getCategoriesWithData } from '@/lib/services/dataAvailabilityService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleGetCategories(request: NextRequest) {
  const url = new URL(request.url);
  const withStats = url.searchParams.get('withStats') === 'true';
  const withAvailability = url.searchParams.get('withAvailability') === 'true';
  
  const categories = withStats 
    ? await getCategoriesWithStatistics()
    : await getAllCategories();
  
  // Add data availability information if requested
  if (withAvailability) {
    const categoriesWithData = await getCategoriesWithData();
    const categoriesWithAvailability = categories.map((category) => ({
      ...category,
      hasData: categoriesWithData.includes(category.name)
    }));
    return createSuccessResponse(categoriesWithAvailability);
  }
    
  return createSuccessResponse(categories);
}

export const GET = withErrorHandling(handleGetCategories); 