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

    if (isNaN(importId)) {
      return createBadRequestResponse('Invalid import ID');
    }

    const result = await UnifiedCSVImportService.validateStagedData(importId);

    if (result.isValid) {
      return createSuccessResponse({
        stats: result.stats,
        warnings: result.warnings
      }, 'Validation completed successfully');
    } else {
      return createBadRequestResponse('Validation failed');
    }

  } catch (error) {
    console.error('Validation error:', error);
    return createErrorResponse(new ServiceError('Validation failed', 'VALIDATION_ERROR', 500));
  }
} 