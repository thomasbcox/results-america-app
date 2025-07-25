import { NextRequest } from 'next/server';
import { UnifiedAuthService } from '@/lib/services/unifiedAuthService';
import { withAuth, withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleGetCurrentUser(authContext: any, request: NextRequest) {
  const user = authContext.user;

  return createSuccessResponse({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  });
}

export const GET = withErrorHandling(withAuth(handleGetCurrentUser)); 