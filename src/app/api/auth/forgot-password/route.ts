import { NextRequest } from 'next/server';
import { validateRequestBody, ForgotPasswordSchema } from '@/lib/validators';
import { PasswordResetService } from '@/lib/services/passwordResetService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleForgotPassword(request: NextRequest) {
  const body = await request.json();
  const { email } = validateRequestBody(ForgotPasswordSchema, body);
  
  const result = await PasswordResetService.initiatePasswordReset({
    email,
    origin: request.nextUrl.origin
  });
  
  return createSuccessResponse(result, result.message);
}

export const POST = withErrorHandling(handleForgotPassword); 