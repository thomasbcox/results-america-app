import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { SimpleCSVImportService } from '@/lib/services/simpleCSVImportService';
import { createSuccessResponse, createErrorResponse } from '@/lib/response';
import { ServiceError } from '@/lib/errors';

export async function GET(request: AuthenticatedRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      console.log('Getting simplified CSV templates');
      const templates = await SimpleCSVImportService.getTemplates();
      
      console.log(`Found ${templates.length} templates`);
      return createSuccessResponse({ data: templates }, 'Templates retrieved successfully');
    } catch (error) {
      console.error('Error getting templates:', error);
      return createErrorResponse(new ServiceError('Failed to get templates', 'FETCH_ERROR', 500));
    }
  });
} 