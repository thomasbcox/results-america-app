import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AdminService } from '@/lib/services/adminService';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';
import { validateQueryParams } from '@/lib/validators';
import { PaginationSchema } from '@/lib/validators';

export async function GET(request: AuthenticatedRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const { page = 1, limit = 20 } = await validateQueryParams(req, PaginationSchema);
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status');
      
      const result = await AdminService.getSuggestions(page, limit, status || undefined);
      return createSuccessResponse(result.suggestions);
    } catch (error) {
      console.error('Get suggestions error:', error);
      return createBadRequestResponse('Failed to get suggestions');
    }
  });
} 