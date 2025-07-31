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
      const result = await AdminService.getUsers(page, limit);
      return createSuccessResponse({
        users: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Get users error:', error);
      return createBadRequestResponse('Failed to get users');
    }
  });
} 