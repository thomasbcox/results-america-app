import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const importId = parseInt(params.id);

    if (isNaN(importId)) {
      return createErrorResponse('Invalid import ID', 400);
    }

    const result = await CSVImportService.publishImport(importId);

    if (result.success) {
      return createSuccessResponse(result.message, {
        publishedRows: result.publishedRows
      });
    } else {
      return createErrorResponse(result.message, 400);
    }

  } catch (error) {
    console.error('Publishing error:', error);
    return createErrorResponse('Publishing failed', 500);
  }
} 