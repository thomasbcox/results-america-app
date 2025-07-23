import { NextResponse } from 'next/server';
import { getCategoriesWithData } from '@/lib/services/dataAvailabilityService';

export async function GET() {
  try {
    const categoriesWithData = await getCategoriesWithData();
    
    return NextResponse.json({
      categoriesWithData,
      totalCategories: categoriesWithData.length
    });
  } catch (error) {
    console.error('Error fetching categories with data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories with data' },
      { status: 500 }
    );
  }
} 