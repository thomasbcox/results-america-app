import { NextRequest } from 'next/server';
import { LoginSchema } from '@/lib/validators';
import { UnifiedAuthService } from '@/lib/services/unifiedAuthService';
import { withErrorHandling, createSuccessResponse } from '@/lib/response';
import { withValidation } from '@/lib/middleware/validation';
import type { LoginSchema as LoginType } from '@/lib/validators';

async function handleLoginRequest(request: NextRequest, data: LoginType) {
  const { email, password } = data;
  
  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();
  
  const result = await UnifiedAuthService.authenticateAdmin({ email: normalizedEmail, password });
  
  return createSuccessResponse(result, 'Login successful');
}

export const POST = withErrorHandling(withValidation(LoginSchema)(handleLoginRequest)); 