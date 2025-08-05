import { NextRequest, NextResponse } from 'next/server';
import { UnifiedCSVImportService } from '@/lib/services/unifiedCSVImportService';
import { createSuccessResponse, createErrorResponse, createBadRequestResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const importId = parseInt(id);
    const { userId } = await request.json();

    if (isNaN(importId)) {
      return createBadRequestResponse('Invalid import ID');
    }

    if (!userId) {
      return createBadRequestResponse('User ID is required');
    }

    const result = await UnifiedCSVImportService.promoteToProduction(importId, userId);

    if (result.success) {
      return createSuccessResponse({
        publishedRows: result.publishedRows
      }, result.message);
    } else {
      return createBadRequestResponse(result.message);
    }

  } catch (error) {
    console.error('Promotion error:', error);
    return createErrorResponse(new ServiceError('Promotion failed', 'PROMOTION_ERROR', 500));
  }
} 