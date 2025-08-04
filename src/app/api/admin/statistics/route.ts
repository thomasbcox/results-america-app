import { NextRequest } from 'next/server';
import { getAdminUser } from '@/lib/middleware/auth';
import { getDb } from '@/lib/db';
import { statistics, categories } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

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

    const db = getDb();
    
    // Get all active statistics with category names
    const allStatistics = await db.select({
      id: statistics.id,
      name: statistics.name,
      raNumber: statistics.raNumber,
      unit: statistics.unit,
      categoryId: statistics.categoryId,
      categoryName: categories.name,
    })
    .from(statistics)
    .leftJoin(categories, eq(statistics.categoryId, categories.id))
    .where(eq(statistics.isActive, 1))
    .orderBy(statistics.name);

    return Response.json({
      success: true,
      data: allStatistics,
    });

  } catch (error) {
    console.error('Statistics API error:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch statistics' 
      },
      { status: 500 }
    );
  }
} 