import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { dataPoints, statistics, states, importSessions } from '@/lib/db/schema-postgres';
import { eq, and } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('📊 Checking if data points table is empty...');
    
    const db = getDb();
    if (!db) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 });
    }

    // Check if data_points table has any data
    const existingDataPoints = await db.select().from(dataPoints).limit(1);
    
    if (existingDataPoints.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Data points table already has data - skipping population',
        details: { dataPointsAdded: 0, skipped: true }
      });
    }

    console.log('📊 Data points table is empty, adding sample data...');

    // Get required reference data
    const [statisticsResult, statesResult, sessionsResult] = await Promise.all([
      db.select().from(statistics).limit(10),
      db.select().from(states).limit(10),
      db.select().from(importSessions).limit(5)
    ]);

    if (statisticsResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No statistics found in database. Please seed statistics first.'
      }, { status: 400 });
    }

    if (statesResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No states found in database. Please seed states first.'
      }, { status: 400 });
    }

    if (sessionsResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No import sessions found in database. Please seed import sessions first.'
      }, { status: 400 });
    }

    // Create sample data points
    const sampleDataPoints = [
      // Education data points
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'California')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'High School Graduation Rate')?.id || statisticsResult[0].id,
        value: 85.2
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Texas')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'High School Graduation Rate')?.id || statisticsResult[0].id,
        value: 89.1
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'New York')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'High School Graduation Rate')?.id || statisticsResult[0].id,
        value: 87.3
      },
      
      // Economy data points
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'California')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'Unemployment Rate')?.id || statisticsResult[0].id,
        value: 3.2
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Texas')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'Unemployment Rate')?.id || statisticsResult[0].id,
        value: 4.1
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'New York')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'Unemployment Rate')?.id || statisticsResult[0].id,
        value: 3.8
      },
      
      // Health data points
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'California')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'Life Expectancy')?.id || statisticsResult[0].id,
        value: 81.2
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Texas')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'Life Expectancy')?.id || statisticsResult[0].id,
        value: 78.9
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'New York')?.id || statesResult[0].id,
        statisticId: statisticsResult.find(s => s.name === 'Life Expectancy')?.id || statisticsResult[0].id,
        value: 80.7
      },
      
      // Additional data points for more states
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Florida')?.id || statesResult[1].id,
        statisticId: statisticsResult.find(s => s.name === 'High School Graduation Rate')?.id || statisticsResult[0].id,
        value: 86.5
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Illinois')?.id || statesResult[1].id,
        statisticId: statisticsResult.find(s => s.name === 'High School Graduation Rate')?.id || statisticsResult[0].id,
        value: 88.2
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Florida')?.id || statesResult[1].id,
        statisticId: statisticsResult.find(s => s.name === 'Unemployment Rate')?.id || statisticsResult[0].id,
        value: 2.9
      },
      {
        importSessionId: sessionsResult[0].id,
        year: 2023,
        stateId: statesResult.find(s => s.name === 'Illinois')?.id || statesResult[1].id,
        statisticId: statisticsResult.find(s => s.name === 'Unemployment Rate')?.id || statisticsResult[0].id,
        value: 4.3
      }
    ];

    // Insert sample data points
    let insertedCount = 0;
    for (const dataPoint of sampleDataPoints) {
      // Check if this exact data point already exists
      const existing = await db.select().from(dataPoints)
        .where(and(
          eq(dataPoints.importSessionId, dataPoint.importSessionId),
          eq(dataPoints.year, dataPoint.year),
          eq(dataPoints.stateId, dataPoint.stateId),
          eq(dataPoints.statisticId, dataPoint.statisticId)
        ))
        .limit(1);
      
      if (existing.length === 0) {
        await db.insert(dataPoints).values(dataPoint);
        insertedCount++;
      }
    }

    console.log(`✅ Added ${insertedCount} sample data points`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedCount} sample data points`,
      details: { 
        dataPointsAdded: insertedCount,
        skipped: false,
        statisticsUsed: statisticsResult.length,
        statesUsed: statesResult.length,
        sessionsUsed: sessionsResult.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error populating sample data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to populate sample data'
    }, { status: 500 });
  }
}
