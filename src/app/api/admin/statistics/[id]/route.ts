import { NextRequest } from 'next/server';
import { validateRequestBody, StatisticUpdateSchema } from '@/lib/validators';
import { StatisticsManagementService } from '@/lib/services/statisticsManagementService';
import { withAdminAuth, withErrorHandling, createSuccessResponse } from '@/lib/response';

async function handleUpdateStatistic(authContext: any, request: NextRequest, params: Promise<{ id: string }>) {
  const { id } = await params;
  const body = await request.json();
  const data = validateRequestBody(StatisticUpdateSchema, body);
  
  const result = await StatisticsManagementService.updateStatistic(parseInt(id), data);
  
  return createSuccessResponse(result, 'Statistic updated successfully');
}

async function handleGetStatistic(authContext: any, request: NextRequest, params: Promise<{ id: string }>) {
  const { id } = await params;
  
  const result = await StatisticsManagementService.getStatistic(parseInt(id));
  
  return createSuccessResponse(result);
}

export const PUT = withErrorHandling(withAdminAuth(handleUpdateStatistic));
export const GET = withErrorHandling(withAdminAuth(handleGetStatistic)); 