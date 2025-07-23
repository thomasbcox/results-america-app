import { NextResponse } from 'next/server';
import { getAllCategories, getCategoriesWithStatistics } from '@/lib/services/categoriesService';
import { getCategoriesWithData } from '@/lib/services/dataAvailabilityService';
import { DatabaseError, ValidationError, isDatabaseError, isValidationError } from '@/lib/errors';
import type { CategoryData } from '@/types/api';

export async function GET(request: Request) {
  try {
    const url = new URL(request?.url || '');
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
      return NextResponse.json(categoriesWithAvailability);
    }
      
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    
    if (isDatabaseError(error)) {
      return NextResponse.json(
        { 
          error: 'Database temporarily unavailable',
          code: 'DATABASE_ERROR',
          details: { code: error.code }
        },
        { status: 503 }
      );
    }
    
    if (isValidationError(error)) {
      return NextResponse.json(
        { 
          error: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
          details: { field: error.field, value: error.value }
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
} 