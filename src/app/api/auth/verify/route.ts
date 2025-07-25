import { NextRequest, NextResponse } from 'next/server';
import { UnifiedAuthService } from '@/lib/services/unifiedAuthService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleMagicLinkVerification(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    throw new Error('Magic link token is required');
  }

  const authResult = await UnifiedAuthService.authenticateWithMagicLink(token);

  const response = createSuccessResponse(
    {
      user: {
        id: authResult.user.id,
        email: authResult.user.email,
        name: authResult.user.name,
        role: authResult.user.role,
        isActive: authResult.user.isActive,
        emailVerified: authResult.user.emailVerified,
        lastLoginAt: authResult.user.lastLoginAt,
      },
      authMethod: authResult.authMethod,
    },
    'Magic link verification successful'
  );

  // Set session cookie
  response.cookies.set('session_token', authResult.session.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });

  return response;
}

export const GET = withErrorHandling(handleMagicLinkVerification); 