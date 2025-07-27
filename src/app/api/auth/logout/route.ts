import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth';
import { AuthService } from '@/lib/services/authService';
import { createSuccessResponse, createBadRequestResponse } from '@/lib/response';

export async function POST(request: AuthenticatedRequest) {
  return withAuth(request, async (req) => {
    try {
      const sessionToken = req.cookies.get('session_token')?.value;
      
      if (sessionToken) {
        await AuthService.deleteSession(sessionToken);
      }

      const response = createSuccessResponse({
        message: 'Logged out successfully',
      });

      // Clear session cookie
      response.cookies.set('session_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
      });

      return response;
    } catch (error) {
      console.error('Logout error:', error);
      return createBadRequestResponse('Failed to logout');
    }
  });
} 