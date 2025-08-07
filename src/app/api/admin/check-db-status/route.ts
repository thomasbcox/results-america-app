import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { statistics, categories, dataSources, dataPoints, states, importSessions } from '@/lib/db/schema-postgres';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Checking production database status...');
    const db = getDb();
    
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed - db is null',
        status: 'CONNECTION_FAILED'
      }, { status: 500 });
    }

    // Test basic connection
    try {
      await db.execute('SELECT 1 as test');
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: `Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        status: 'CONNECTION_TEST_FAILED'
      }, { status: 500 });
    }

    // Check table counts
    const counts = await Promise.all([
      db.select().from(statistics).then(result => result.length).catch(() => 0),
      db.select().from(categories).then(result => result.length).catch(() => 0),
      db.select().from(dataSources).then(result => result.length).catch(() => 0),
      db.select().from(dataPoints).then(result => result.length).catch(() => 0),
      db.select().from(states).then(result => result.length).catch(() => 0),
      db.select().from(importSessions).then(result => result.length).catch(() => 0),
    ]);

    const [statisticsCount, categoriesCount, dataSourcesCount, dataPointsCount, statesCount, importSessionsCount] = counts;

    const status = {
      connection: 'OK',
      statistics: statisticsCount,
      categories: categoriesCount,
      dataSources: dataSourcesCount,
      dataPoints: dataPointsCount,
      states: statesCount,
      importSessions: importSessionsCount,
      hasData: dataPointsCount > 0,
      needsSeeding: statisticsCount === 0 || categoriesCount === 0 || statesCount === 0
    };

    console.log('✅ Database status check completed:', status);

    return NextResponse.json({
      success: true,
      message: 'Database status check completed',
      data: status
    });

  } catch (error) {
    console.error('❌ Database status check error:', error);
    return NextResponse.json({
      success: false,
      error: `Database status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      status: 'CHECK_FAILED'
    }, { status: 500 });
  }
}
