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

    const result = await CSVImportService.validateImport(importId);

    if (result.isValid) {
      return createSuccessResponse({
        stats: result.stats,
        warnings: result.warnings
      }, 'Validation completed successfully');
    } else {
      return createErrorResponse('Validation failed', 400, {
        errors: result.errors,
        warnings: result.warnings,
        stats: result.stats
      });
    }

  } catch (error) {
    console.error('Validation error:', error);
    return createErrorResponse('Validation failed', 500);
  }
} 