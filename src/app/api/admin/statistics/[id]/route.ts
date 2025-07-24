import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';
import { db } from '@/lib/db/index';
import { statistics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromSession(sessionToken);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const { dataQuality, provenance, name, description, unit, isActive } = body;

    // Validate data quality
    if (dataQuality && !['mock', 'real'].includes(dataQuality)) {
      return NextResponse.json(
        { error: 'Data quality must be either "mock" or "real"' },
        { status: 400 }
      );
    }

    // Update the statistic
    const [updatedStatistic] = await db.update(statistics)
      .set({
        ...(dataQuality && { dataQuality }),
        ...(provenance !== undefined && { provenance }),
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(unit && { unit }),
        ...(isActive !== undefined && { isActive })
      })
      .where(eq(statistics.id, parseInt(id)))
      .returning();

    if (!updatedStatistic) {
      return NextResponse.json(
        { error: 'Statistic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Statistic updated successfully',
      statistic: updatedStatistic
    });

  } catch (error) {
    console.error('Error updating statistic:', error);
    return NextResponse.json(
      { error: 'Failed to update statistic' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin authentication
    const sessionToken = request.cookies.get('session_token')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const user = await AuthService.getUserFromSession(sessionToken);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const [statistic] = await db.select().from(statistics)
      .where(eq(statistics.id, parseInt(id)))
      .limit(1);

    if (!statistic) {
      return NextResponse.json(
        { error: 'Statistic not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      statistic
    });

  } catch (error) {
    console.error('Error fetching statistic:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistic' },
      { status: 500 }
    );
  }
} 