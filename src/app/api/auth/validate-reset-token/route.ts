import { NextRequest } from 'next/server';
import { validateRequestBody, ValidateTokenSchema } from '@/lib/validators';
import { PasswordResetService } from '@/lib/services/passwordResetService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleValidateResetToken(request: NextRequest) {
  const body = await request.json();
  const { token } = validateRequestBody(ValidateTokenSchema, body);
  
  const isValid = await PasswordResetService.validateResetToken(token);
  
  if (!isValid) {
    throw new Error('Invalid or expired reset token');
  }
  
  return createSuccessResponse({}, 'Token is valid');
}

export const POST = withErrorHandling(handleValidateResetToken); 