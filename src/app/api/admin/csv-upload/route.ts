import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/middleware/auth';
import { createBadRequestResponse, createErrorResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';
import { ComprehensiveCSVImportService } from '@/lib/services/comprehensiveCSVImportService';

export async function POST(request: NextRequest) {
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return createBadRequestResponse('Unauthorized');
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateId = formData.get('templateId') as string;

    if (!file) {
      return createBadRequestResponse('No file provided');
    }

    if (file.size === 0) {
      return createBadRequestResponse('File is empty');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      return createBadRequestResponse('File too large (max 10MB)');
    }

    const allowedTypes = ['text/csv', 'application/csv'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
      return createBadRequestResponse('Invalid file type - only CSV files allowed');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const templateIdNum = templateId ? parseInt(templateId) : undefined;

    const result = await ComprehensiveCSVImportService.importCSV(
      user.id,
      file.name,
      buffer,
      templateIdNum
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        importId: result.importId,
        message: result.message,
        stats: result.stats,
        summary: result.summary,
      });
    } else {
      // Log detailed failure information
      console.error('CSV import failed:', {
        importId: result.importId,
        message: result.message,
        stats: result.stats,
        summary: result.summary,
        timestamp: new Date().toISOString()
      });
      
      return NextResponse.json({
        success: false,
        importId: result.importId,
        message: result.message,
        stats: result.stats,
        summary: result.summary,
        error: {
          type: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        }
      }, { status: 400 });
    }

  } catch (error) {
    console.error('CSV upload error:', error);
    
    // Preserve detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : 'No stack trace available';
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorDetails,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({
      success: false,
      message: `Upload failed: ${errorMessage}`,
      error: {
        message: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
} 