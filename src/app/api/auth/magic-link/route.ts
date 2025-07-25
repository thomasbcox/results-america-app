import { NextRequest } from 'next/server';
import { ForgotPasswordSchema } from '@/lib/validators';
import { MagicLinkService } from '@/lib/services/magicLinkService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';
import { withValidation } from '@/lib/middleware/validation';
import type { ForgotPasswordSchema as ForgotPasswordType } from '@/lib/validators';

async function handleMagicLinkRequest(request: NextRequest, data: ForgotPasswordType) {
  const { email } = data;
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await MagicLinkService.createMagicLink(normalizedEmail);
  
  return createSuccessResponse(result, 'Magic link sent successfully');
}

export const POST = withErrorHandling(withValidation(ForgotPasswordSchema)(handleMagicLinkRequest)); 