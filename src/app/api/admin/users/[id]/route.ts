import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AdminService } from '@/lib/services/adminService';
import { createSuccessResponse, createNotFoundResponse, createBadRequestResponse } from '@/lib/response';
import { validateQueryParams } from '@/lib/validators';
import { IdParamSchema } from '@/lib/validators';
import { z } from 'zod';

const UpdateUserSchema = z.object({
  role: z.enum(['user', 'admin']).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await validateQueryParams(req, IdParamSchema);
      const user = await AdminService.getUserDetails(id);
      
      if (!user) {
        return createNotFoundResponse('User not found');
      }
      
      return createSuccessResponse(user);
    } catch (error) {
      console.error('Get user details error:', error);
      return createBadRequestResponse('Failed to get user details');
    }
  });
}

export async function PATCH(
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAdminAuth(request, async (req) => {
    try {
      const { id } = await validateQueryParams(req, IdParamSchema);
      const body = await request.json();
      const updates = UpdateUserSchema.parse(body);

      let user;
      
      if (updates.role !== undefined) {
        user = await AdminService.updateUserRole(id, updates.role);
      } else if (updates.isActive !== undefined) {
        // Toggle status if isActive is provided
        user = await AdminService.toggleUserStatus(id);
      } else {
        return createNotFoundResponse('No valid updates provided');
      }

      return createSuccessResponse(user);
    } catch (error) {
      console.error('Update user error:', error);
      return createBadRequestResponse('Failed to update user');
    }
  });
} 