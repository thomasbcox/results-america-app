import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse, createBadRequestResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const importId = parseInt(id);

    if (isNaN(importId)) {
      return createBadRequestResponse('Invalid import ID');
    }

    const result = await CSVImportService.publishImport(importId);

    if (result.success) {
      return createSuccessResponse({
        publishedRows: result.publishedRows
      }, result.message);
    } else {
      return createBadRequestResponse(result.message);
    }

  } catch (error) {
    console.error('Publishing error:', error);
    return createErrorResponse(new ServiceError('Publishing failed', 'PUBLISH_ERROR', 500));
  }
} 