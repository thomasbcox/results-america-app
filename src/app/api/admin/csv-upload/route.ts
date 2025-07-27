import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateId = formData.get('templateId') as string;
    const metadata = formData.get('metadata') as string;

    if (!file || !templateId || !metadata) {
      return createErrorResponse('Missing required fields', 400);
    }

    // Validate file type
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      return createErrorResponse('Invalid file type. Please upload a CSV file.', 400);
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return createErrorResponse('File too large. Maximum size is 10MB.', 400);
    }

    // Parse metadata
    let parsedMetadata: Record<string, any>;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      return createErrorResponse('Invalid metadata format', 400);
    }

    // TODO: Get actual user ID from session
    const uploadedBy = 1; // Temporary hardcoded admin user

    // Upload and stage the CSV
    const result = await CSVImportService.uploadCSV(
      file,
      parseInt(templateId),
      parsedMetadata,
      uploadedBy
    );

    if (result.success) {
      return createSuccessResponse(result.message, {
        importId: result.importId,
        stats: result.stats
      });
    } else {
      return createErrorResponse(result.message, 400, result.errors);
    }

  } catch (error) {
    console.error('CSV upload error:', error);
    return createErrorResponse('Upload failed', 500);
  }
} 