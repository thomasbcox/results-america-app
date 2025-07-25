import { NextRequest } from 'next/server';
import { UnifiedAuthService } from '@/lib/services/unifiedAuthService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleLogout(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token')?.value;

  if (sessionToken) {
    await UnifiedAuthService.logout(sessionToken);
  }

  const response = createSuccessResponse(null, 'Logout successful');

  // Clear session cookie
  response.cookies.set('session_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

export const POST = withErrorHandling(handleLogout); 