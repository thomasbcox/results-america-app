import { NextRequest } from 'next/server';
import { getAdminUser } from '@/lib/middleware/auth';
import { getDb } from '@/lib/db';
import { categories } from '@/lib/db/schema';
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
    
    // Get all active categories
    const allCategories = await db.select({
      id: categories.id,
      name: categories.name,
      description: categories.description,
    })
    .from(categories)
    .where(eq(categories.isActive, 1))
    .orderBy(categories.name);

    return Response.json({
      success: true,
      data: allCategories,
    });

  } catch (error) {
    console.error('Categories API error:', error);
    return Response.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch categories' 
      },
      { status: 500 }
    );
  }
} 