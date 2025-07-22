import { NextResponse } from 'next/server';
import { getAllStates, getStatesWithPagination, searchStates } from '@/lib/services/statesService';

export async function GET(request?: Request) {
  try {
    const url = new URL(request?.url || '');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search');
    const sortBy = url.searchParams.get('sortBy');
    const sortOrder = url.searchParams.get('sortOrder') as 'asc' | 'desc' || 'asc';

    // Handle search
    if (search) {
      const results = await searchStates(search);
      return NextResponse.json(results);
    }

    // Handle pagination
    if (page > 1 || limit !== 50) {
      const paginated = await getStatesWithPagination(
        { page, limit },
        { sortBy, sortOrder }
      );
      return NextResponse.json(paginated);
    }

    // Handle sorting without pagination
    if (sortBy) {
      const paginated = await getStatesWithPagination(
        { page: 1, limit: 50 },
        { sortBy, sortOrder }
      );
      return NextResponse.json(paginated.data);
    }

    // Default: return all states
    const states = await getAllStates();
    return NextResponse.json(states);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
} 