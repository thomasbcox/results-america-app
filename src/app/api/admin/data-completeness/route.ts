import { NextRequest } from 'next/server';
import { DataCompletenessService } from '@/lib/services/dataCompletenessService';
import { getAdminUser } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const user = await getAdminUser(request);
    if (!user) {
      return Response.json(
        { success: false, error: 'Admin access required' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId') ? 
      parseInt(url.searchParams.get('categoryId')!) : undefined;
    const metricId = url.searchParams.get('metricId') ? 
      parseInt(url.searchParams.get('metricId')!) : undefined;
    const year = url.searchParams.get('year') ? 
      parseInt(url.searchParams.get('year')!) : undefined;
    const dataState = url.searchParams.get('dataState') as 
      'production' | 'staged' | 'overlap' | 'incomplete' | undefined;
    const showIncompleteOnly = url.searchParams.get('showIncompleteOnly') === 'true';
    const showStagedOnly = url.searchParams.get('showStagedOnly') === 'true';

    // Get completeness report
    const report = await DataCompletenessService.getCompletenessReport({
      categoryId,
      metricId,
      year,
      dataState,
      showIncompleteOnly,
      showStagedOnly,
    });

    return Response.json({
      success: true,
      data: report,
    });

  } catch (error) {
    console.error('Data completeness report error:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate completeness report' 
      },
      { status: 500 }
    );
  }
} 