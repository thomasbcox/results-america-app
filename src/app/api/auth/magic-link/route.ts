import { NextRequest, NextResponse } from 'next/server';
import { MagicLinkService } from '@/lib/services/magicLinkService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleMagicLinkRequest(request: NextRequest) {
  const { email, name } = await request.json();

  if (!email) {
    throw new Error('Email is required');
  }

  const magicLinkUrl = await MagicLinkService.createMagicLink({ email, name });

  return createSuccessResponse(
    { magicLinkUrl },
    'Magic link sent to your email',
    200
  );
}

export const POST = withErrorHandling(handleMagicLinkRequest); 