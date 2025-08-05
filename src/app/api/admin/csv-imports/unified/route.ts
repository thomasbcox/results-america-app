import { NextRequest, NextResponse } from 'next/server';
import { UnifiedCSVImportService } from '@/lib/services/unifiedCSVImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateId = parseInt(formData.get('templateId') as string);
    const metadata = JSON.parse(formData.get('metadata') as string);
    const userId = parseInt(formData.get('userId') as string);

    if (!file || !templateId || !userId) {
      return createErrorResponse(new ServiceError('Missing required fields', 'VALIDATION_ERROR', 400));
    }

    const result = await UnifiedCSVImportService.uploadAndStage(file, templateId, metadata, userId);

    if (result.success) {
      return createSuccessResponse({
        importId: result.importId,
        message: result.message,
        stats: result.stats
      });
    } else {
      return createErrorResponse(new ServiceError(result.message, 'IMPORT_ERROR', 400));
    }

  } catch (error) {
    console.error('Unified CSV import error:', error);
    return createErrorResponse(new ServiceError('Import failed', 'IMPORT_ERROR', 500));
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    // This would need to be implemented in the service
    // const history = await UnifiedCSVImportService.getImportHistory(limit);

    return createSuccessResponse({ data: [] });

  } catch (error) {
    console.error('Error fetching import history:', error);
    return createErrorResponse(new ServiceError('Failed to fetch import history', 'FETCH_ERROR', 500));
  }
} 