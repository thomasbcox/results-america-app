import { NextRequest } from 'next/server';
import { validateRequestBody, validateQueryParams, ExternalDataImportSchema, ExternalDataQuerySchema } from '@/lib/validators';
import { ExternalDataService } from '@/lib/services/externalDataService';
import { withAdminAuth, withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleExternalDataImport(authContext: any, request: NextRequest) {
  const body = await request.json();
  const data = validateRequestBody(ExternalDataImportSchema, body);
  
  const result = await ExternalDataService.importData(data);
  
  return createSuccessResponse(result, result.message);
}

async function handleExternalDataQuery(authContext: any, request: NextRequest) {
  const url = new URL(request.url);
  const params = validateQueryParams(ExternalDataQuerySchema, url.searchParams);
  
  if (params.action === 'sources') {
    const sources = ExternalDataService.getAvailableSources();
    return createSuccessResponse({ sources });
  }
  
  throw new Error('Invalid action parameter');
}

export const POST = withErrorHandling(withAdminAuth(handleExternalDataImport));
export const GET = withErrorHandling(withAdminAuth(handleExternalDataQuery)); 