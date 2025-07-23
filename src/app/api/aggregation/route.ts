import { NextResponse } from 'next/server';
import { 
  getStatisticComparison, 
  getStateComparison, 
  getTopPerformers, 
  getBottomPerformers,
  getTrendData 
} from '@/lib/services/aggregationService';

export async function GET(request: Request) {
  try {
    const url = new URL(request?.url || '');
    const type = url.searchParams.get('type');
    const statisticId = parseInt(url.searchParams.get('statisticId') || '0');
    const stateId = parseInt(url.searchParams.get('stateId') || '0');
    const year = parseInt(url.searchParams.get('year') || '2023');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (!type) {
      return NextResponse.json(
        { error: 'Missing required parameter: type' },
        { status: 400 }
      );
    }

    let result;

    switch (type) {
      case 'statistic-comparison':
        if (!statisticId) {
          return NextResponse.json(
            { error: 'Missing required parameter: statisticId' },
            { status: 400 }
          );
        }
        result = await getStatisticComparison(statisticId, year);
        break;

      case 'state-comparison':
        if (!stateId) {
          return NextResponse.json(
            { error: 'Missing required parameter: stateId' },
            { status: 400 }
          );
        }
        result = await getStateComparison(stateId, year);
        break;

      case 'top-performers':
        if (!statisticId) {
          return NextResponse.json(
            { error: 'Missing required parameter: statisticId' },
            { status: 400 }
          );
        }
        result = await getTopPerformers(statisticId, limit, year);
        break;

      case 'bottom-performers':
        if (!statisticId) {
          return NextResponse.json(
            { error: 'Missing required parameter: statisticId' },
            { status: 400 }
          );
        }
        result = await getBottomPerformers(statisticId, limit, year);
        break;

      case 'trend-data':
        if (!statisticId || !stateId) {
          return NextResponse.json(
            { error: 'Missing required parameters: statisticId and stateId' },
            { status: 400 }
          );
        }
        result = await getTrendData(statisticId, stateId);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid type. Supported types: statistic-comparison, state-comparison, top-performers, bottom-performers, trend-data' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in aggregation API:', error);
    return NextResponse.json(
      { error: 'Failed to process aggregation request' },
      { status: 500 }
    );
  }
} 