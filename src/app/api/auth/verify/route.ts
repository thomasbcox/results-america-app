import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/authService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

const VerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = VerifySchema.parse(body);

    const user = await AuthService.verifyMagicLink(token);
    const session = await AuthService.createSession(user.id);

    const response = createSuccessResponse({
      message: 'Authentication successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set session cookie
    response.cookies.set('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Magic link verification error:', error);
    return createBadRequestResponse('Failed to verify magic link');
  }
} 