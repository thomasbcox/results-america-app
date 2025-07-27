import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';

export async function GET(request: AuthenticatedRequest) {
  return withAuth(request, async (req) => {
    try {
      return createSuccessResponse({
        user: {
          id: req.user.id,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          emailVerified: req.user.emailVerified,
          createdAt: req.user.createdAt,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      return createBadRequestResponse('Failed to get user information');
    }
  });
} 