import { NextRequest } from 'next/server';
import { validateRequestBody, BootstrapAdminSchema } from '@/lib/validators';
import { BootstrapService } from '@/lib/services/bootstrapService';
import { withErrorHandling, createCreatedResponse } from '@/lib/response';

async function handleBootstrapRequest(request: NextRequest) {
  const body = await request.json();
  const data = validateRequestBody(BootstrapAdminSchema, body);
  
  const result = await BootstrapService.bootstrapAdminUser(data);
  
  return createCreatedResponse(result, result.message);
}

export const POST = withErrorHandling(handleBootstrapRequest); 