import { NextResponse } from 'next/server';
import { getDataPointsForState, getDataPointsForStatistic, getDataPointsForComparison } from '@/lib/services/dataPointsService';

export async function GET(request?: Request) {
  try {
    const url = new URL(request?.url || '');
    const stateId = url.searchParams.get('stateId');
    const statisticId = url.searchParams.get('statisticId');
    const year = url.searchParams.get('year');
    const stateIds = url.searchParams.get('stateIds');
    const statisticIds = url.searchParams.get('statisticIds');

    let dataPoints;

    if (stateId) {
      dataPoints = await getDataPointsForState(
        parseInt(stateId), 
        year ? parseInt(year) : undefined
      );
    } else if (statisticId) {
      dataPoints = await getDataPointsForStatistic(
        parseInt(statisticId), 
        year ? parseInt(year) : undefined
      );
    } else if (stateIds && statisticIds && year) {
      const stateIdArray = stateIds.split(',').map(id => parseInt(id));
      const statisticIdArray = statisticIds.split(',').map(id => parseInt(id));
      dataPoints = await getDataPointsForComparison(
        stateIdArray, 
        statisticIdArray, 
        parseInt(year)
      );
    } else {
      return NextResponse.json(
        { error: 'Missing required parameters. Use stateId, statisticId, or both stateIds and statisticIds with year' },
        { status: 400 }
      );
    }

    return NextResponse.json(dataPoints);
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data points' },
      { status: 500 }
    );
  }
} 