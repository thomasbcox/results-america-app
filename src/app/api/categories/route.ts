import { NextResponse } from 'next/server';
import { getAllCategories, getCategoriesWithStatistics } from '@/lib/services/categoriesService';

export async function GET(request?: Request) {
  try {
    const url = new URL(request?.url || '');
    const withStats = url.searchParams.get('withStats') === 'true';
    
    const categories = withStats 
      ? await getCategoriesWithStatistics()
      : await getAllCategories();
      
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 