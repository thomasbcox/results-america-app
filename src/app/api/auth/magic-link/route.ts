import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/lib/services/authService';
import { withErrorHandling, createSuccessResponse, createBadRequestResponse } from '@/lib/response';

const MagicLinkSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = MagicLinkSchema.parse(body);

    const { token, expiresAt } = await AuthService.createMagicLink(email);

    // In a real application, you would send an email here
    // For development, we'll return the token in the response
    const magicLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify?token=${token}`;

    return createSuccessResponse({
      message: 'Magic link created successfully',
      expiresAt,
      // Remove this in production - only for development
      magicLink: process.env.NODE_ENV === 'development' ? magicLink : undefined,
    });
  } catch (error) {
    console.error('Magic link creation error:', error);
    if (error instanceof Error) {
      return createBadRequestResponse(`Failed to create magic link: ${error.message}`);
    }
    return createBadRequestResponse('Failed to create magic link');
  }
} 