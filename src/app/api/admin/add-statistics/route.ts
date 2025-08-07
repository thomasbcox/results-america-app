import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { statistics, categories, dataSources } from '@/lib/db/schema-postgres';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    console.log('📈 Adding essential statistics to production database...');
    
    const db = getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Get category and data source IDs
    const categoriesResult = await db.select().from(categories);
    const dataSourcesResult = await db.select().from(dataSources);
    
    const categoryMap = new Map(categoriesResult.map((c: { name: string; id: number }) => [c.name, c.id]));
    const sourceMap = new Map(dataSourcesResult.map((s: { name: string; id: number }) => [s.name, s.id]));

    // Essential statistics for the /measure page
    const statisticsData = [
      // Education Statistics
      { 
        categoryId: categoryMap.get('Education')!, 
        dataSourceId: sourceMap.get('US Census Bureau')!, 
        name: 'High School Graduation Rate', 
        description: 'Percentage of students who graduate high school', 
        unit: 'percentage',
        preferenceDirection: 'higher' as const,
        isActive: 1
      },
      { 
        categoryId: categoryMap.get('Education')!, 
        dataSourceId: sourceMap.get('US Census Bureau')!, 
        name: 'College Enrollment Rate', 
        description: 'Percentage of high school graduates who enroll in college', 
        unit: 'percentage',
        preferenceDirection: 'higher' as const,
        isActive: 1
      },
      
      // Economy Statistics
      { 
        categoryId: categoryMap.get('Economy')!, 
        dataSourceId: sourceMap.get('Bureau of Labor Statistics')!, 
        name: 'Unemployment Rate', 
        description: 'Percentage of labor force that is unemployed', 
        unit: 'percentage',
        preferenceDirection: 'lower' as const,
        isActive: 1
      },
      { 
        categoryId: categoryMap.get('Economy')!, 
        dataSourceId: sourceMap.get('Bureau of Economic Analysis')!, 
        name: 'GDP per Capita', 
        description: 'Gross Domestic Product per person', 
        unit: 'dollars',
        preferenceDirection: 'higher' as const,
        isActive: 1
      },
      
      // Health Statistics
      { 
        categoryId: categoryMap.get('Health')!, 
        dataSourceId: sourceMap.get('CDC')!, 
        name: 'Life Expectancy', 
        description: 'Average life expectancy at birth', 
        unit: 'years',
        preferenceDirection: 'higher' as const,
        isActive: 1
      }
    ];

    let insertedCount = 0;
    for (const stat of statisticsData) {
      const existing = await db.select().from(statistics).where(eq(statistics.name, stat.name)).limit(1);
      if (existing.length === 0) {
        await db.insert(statistics).values(stat);
        insertedCount++;
      }
    }

    console.log(`✅ Added ${insertedCount} new statistics`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully added ${insertedCount} statistics`,
      details: { statisticsInserted: insertedCount }
    });
    
  } catch (error) {
    console.error('❌ Error adding statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to add statistics'
    }, { status: 500 });
  }
}
