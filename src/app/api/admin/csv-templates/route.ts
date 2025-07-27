import { NextRequest, NextResponse } from 'next/server';
import { CSVImportService } from '@/lib/services/csvImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    const templates = await CSVImportService.getTemplates();

    return createSuccessResponse('Templates retrieved successfully', templates);

  } catch (error) {
    console.error('Error fetching templates:', error);
    return createErrorResponse('Failed to fetch templates', 500);
  }
} 