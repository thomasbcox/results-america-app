import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/middleware/auth';
import { createBadRequestResponse, createErrorResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';
import { ComprehensiveCSVImportService } from '@/lib/services/comprehensiveCSVImportService';
import { ImportLoggingService } from '@/lib/services/importLoggingService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return createBadRequestResponse('Unauthorized');
    }

    const resolvedParams = await params;
    const importId = parseInt(resolvedParams.id);
    if (isNaN(importId)) {
      return createBadRequestResponse('Invalid import ID');
    }

    const details = await ComprehensiveCSVImportService.getImportDetails(importId);

    return NextResponse.json({
      success: true,
      import: details.import,
      logs: details.logs,
      summary: details.summary,
    });

  } catch (error) {
    console.error('Get import details error:', error);
    return createErrorResponse(new ServiceError(
      'Failed to get import details',
      'IMPORT_DETAILS_ERROR',
      500
    ));
  }
} 