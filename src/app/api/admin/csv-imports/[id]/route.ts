import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AdminService } from '@/lib/services/adminService';
import { createSuccessResponse, createBadRequestResponse, createNotFoundResponse } from '@/lib/response';

export async function GET(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await params;
      const importId = parseInt(id);
      
      if (isNaN(importId)) {
        return createBadRequestResponse('Invalid import ID');
      }

      const importDetails = await AdminService.getImportDetails(importId);
      return createSuccessResponse(importDetails);
    } catch (error) {
      console.error('Get import details error:', error);
      if (error instanceof Error && error.message.includes('not found')) {
        return createNotFoundResponse('Import not found');
      }
      return createBadRequestResponse('Failed to get import details');
    }
  });
} 