import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const history = await CSVImportService.getImportHistory(limit);

    return createSuccessResponse('Import history retrieved successfully', history);

  } catch (error) {
    console.error('Error fetching import history:', error);
    return createErrorResponse('Failed to fetch import history', 500);
  }
} 