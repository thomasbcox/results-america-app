import { NextRequest } from 'next/server';
import { StatisticsManagementService } from '@/lib/services/statisticsManagementService';
import { withErrorHandling, createSuccessResponse, createNotFoundResponse } from '@/lib/response';
import { IdParamSchema } from '@/lib/validators';

async function handleStatisticRequest(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const validatedId = IdParamSchema.parse({ id });
  
  try {
    const statistic = await StatisticsManagementService.getStatistic(validatedId.id);
    return createSuccessResponse(statistic);
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      return createNotFoundResponse('Statistic not found');
    }
    throw error;
  }
}

export const GET = withErrorHandling(handleStatisticRequest); 