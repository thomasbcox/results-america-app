import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function POST(request: AuthenticatedRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      console.log('CSV upload started');
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const templateId = formData.get('templateId') as string;
      const metadata = formData.get('metadata') as string;

      console.log('Upload data:', {
        fileName: file?.name,
        fileSize: file?.size,
        templateId,
        metadata: metadata ? JSON.parse(metadata) : null
      });

      if (!file || !templateId || !metadata) {
        console.log('Missing required fields');
        return createErrorResponse('Missing required fields', 400);
      }

      // Validate file type
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        console.log('Invalid file type:', file.type, file.name);
        return createErrorResponse('Invalid file type. Please upload a CSV file.', 400);
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.log('File too large:', file.size);
        return createErrorResponse('File too large. Maximum size is 10MB.', 400);
      }

      // Parse metadata
      let parsedMetadata: Record<string, any>;
      try {
        parsedMetadata = JSON.parse(metadata);
        console.log('Parsed metadata:', parsedMetadata);
      } catch (error) {
        console.log('Metadata parse error:', error);
        return createErrorResponse('Invalid metadata format', 400);
      }

      // Get user ID from authenticated session
      const uploadedBy = req.user!.id;
      console.log('Uploaded by user ID:', uploadedBy);

      // Upload and stage the CSV
      console.log('Calling CSVImportService.uploadCSV');
      const result = await CSVImportService.uploadCSV(
        file,
        parseInt(templateId),
        parsedMetadata,
        uploadedBy
      );

      console.log('Upload result:', result);

      if (result.success) {
        return createSuccessResponse({
          importId: result.importId,
          stats: result.stats
        }, result.message);
      } else {
        console.log('Upload failed, returning error response');
        return NextResponse.json({
          success: false,
          error: result.message,
          errors: result.errors
        }, { status: 400 });
      }

    } catch (error) {
      console.error('CSV upload error:', error);
      return createErrorResponse('Upload failed', 500);
    }
  });
} 