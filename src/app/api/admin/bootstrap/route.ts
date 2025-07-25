import { NextRequest } from 'next/server';
import { BootstrapAdminSchema } from '@/lib/validators';
import { BootstrapService } from '@/lib/services/bootstrapService';
import { withErrorHandling, createCreatedResponse } from '@/lib/response';
import { withBodyValidation } from '@/lib/middleware/validation';
import type { BootstrapAdminSchema as BootstrapAdminType } from '@/lib/validators';

async function handleBootstrapRequest(request: NextRequest, data: BootstrapAdminType) {
  const result = await BootstrapService.bootstrapAdminUser(data);
  return createCreatedResponse(result, result.message);
}

export const POST = withErrorHandling(withBodyValidation(BootstrapAdminSchema)(handleBootstrapRequest)); 