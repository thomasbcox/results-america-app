import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await CSVImportService.getImportHistory(limit);

    return createSuccessResponse({ data: history });

  } catch (error) {
    console.error('Error fetching import history:', error);
    return createErrorResponse(new ServiceError('Failed to fetch import history', 'FETCH_ERROR', 500));
  }
} 