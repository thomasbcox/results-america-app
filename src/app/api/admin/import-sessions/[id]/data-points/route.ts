import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { dataPoints, states, categories, statistics } from '@/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';
import { getAdminUser } from '@/lib/middleware/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const sessionId = parseInt(id);
    if (isNaN(sessionId)) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    const db = getDb();
    
    // Get data points with state, category, and statistic names
    const dataPointsResult = await db
      .select({
        id: dataPoints.id,
        stateId: dataPoints.stateId,
        statisticId: dataPoints.statisticId,
        value: dataPoints.value,
        year: dataPoints.year,
        stateName: states.name,
        categoryName: categories.name,
        statisticName: statistics.name,
      })
      .from(dataPoints)
      .leftJoin(states, eq(dataPoints.stateId, states.id))
      .leftJoin(statistics, eq(dataPoints.statisticId, statistics.id))
      .leftJoin(categories, eq(statistics.categoryId, categories.id))
      .where(eq(dataPoints.importSessionId, sessionId))
      .orderBy(dataPoints.id);

    return NextResponse.json({ 
      dataPoints: dataPointsResult,
      count: dataPointsResult.length
    });
  } catch (error) {
    console.error('Error fetching data points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data points' },
      { status: 500 }
    );
  }
} 