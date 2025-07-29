import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';

export async function GET(request: NextRequest) {
  try {
    // Get all cookies
    const cookies = request.cookies.getAll();
    const sessionToken = request.cookies.get('session_token')?.value;
    
    const debugInfo: any = {
      cookies: cookies.map(c => ({ name: c.name, value: c.value })),
      sessionToken: sessionToken || 'not found',
      hasSessionToken: !!sessionToken,
      userAgent: request.headers.get('user-agent'),
      referer: request.headers.get('referer'),
      origin: request.headers.get('origin'),
    };

    // Try to get user if session exists
    if (sessionToken) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/auth/me`, {
          headers: {
            'Cookie': `session_token=${sessionToken}`
          }
        });
        const userData = await response.json();
        debugInfo.userData = userData;
      } catch (error) {
        debugInfo.userDataError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    return createSuccessResponse(debugInfo);
  } catch (error) {
    console.error('Debug session error:', error);
    return createBadRequestResponse('Failed to debug session');
  }
} 