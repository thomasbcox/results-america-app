import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/middleware/auth';
import { createBadRequestResponse, createErrorResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';
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

    const failedRowsCSV = await ImportLoggingService.getFailedRowsCSV(importId);

    if (!failedRowsCSV) {
      return createBadRequestResponse('No failed rows found for this import');
    }

    return new NextResponse(failedRowsCSV, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="failed-rows-import-${importId}.csv"`,
      },
    });

  } catch (error) {
    console.error('Download failed rows error:', error);
    return createErrorResponse(new ServiceError(
      'Failed to download failed rows',
      'FAILED_ROWS_DOWNLOAD_ERROR',
      500
    ));
  }
} 