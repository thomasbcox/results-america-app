import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AdminService } from '@/lib/services/adminService';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';

export async function GET(request: AuthenticatedRequest) {
  return withAdminAuth(request, async (req) => {
    try {
      const stats = await AdminService.getSystemStats();
      return createSuccessResponse({
        users: stats.users,
        suggestions: stats.suggestions,
        data: stats.data,
      });
    } catch (error) {
      console.error('Get admin stats error:', error);
      return createBadRequestResponse('Failed to get admin statistics');
    }
  });
} 