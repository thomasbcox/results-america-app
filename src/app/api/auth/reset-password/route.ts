import { NextRequest } from 'next/server';
import { validateRequestBody, ResetPasswordSchema } from '@/lib/validators';
import { PasswordResetService } from '@/lib/services/passwordResetService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleResetPassword(request: NextRequest) {
  const body = await request.json();
  const { token, password } = validateRequestBody(ResetPasswordSchema, body);
  
  const message = await PasswordResetService.resetPassword({ token, password });
  
  return createSuccessResponse({}, message);
}

export const POST = withErrorHandling(handleResetPassword); 