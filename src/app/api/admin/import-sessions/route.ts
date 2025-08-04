import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { importSessions, csvImports, dataPoints, states, categories, statistics } from '@/lib/db/schema-postgres';
import { eq, desc, sql } from 'drizzle-orm';
import { getAdminUser } from '@/lib/middleware/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const db = getDb();
    
    // Get all import sessions with basic data and import details
    const sessions = await db
      .select({
        id: importSessions.id,
        name: importSessions.name,
        description: importSessions.description,
        dataSourceId: importSessions.dataSourceId,
        dataYear: importSessions.dataYear,
        recordCount: importSessions.recordCount,
        isActive: importSessions.isActive,
        createdAt: importSessions.importDate, // Map importDate to createdAt
        updatedAt: importSessions.importDate, // Use importDate for updatedAt too
        importId: csvImports.id,
        importName: csvImports.name,
        importStatus: csvImports.status,
        importUploadedAt: csvImports.uploadedAt,
      })
      .from(importSessions)
      .leftJoin(csvImports, eq(importSessions.id, csvImports.id))
      .orderBy(desc(importSessions.importDate));

    // Get data point counts for each session
    const sessionsWithCounts = await Promise.all(
      sessions.map(async (session: any) => {
        const dataPointCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(dataPoints)
          .where(eq(dataPoints.importSessionId, session.id));

        // Determine coherent status based on data points and session state
        let sessionStatus = 'unknown';
        const actualDataPoints = dataPointCount[0]?.count || 0;
        
        if (actualDataPoints > 0) {
          // Has data points - check if active
          sessionStatus = session.isActive === 1 ? 'active' : 'inactive';
        } else if (session.recordCount && session.recordCount > 0) {
          // Expected data but none imported - likely failed
          sessionStatus = 'failed';
        } else {
          // No expected data and no actual data
          sessionStatus = 'empty';
        }

        return {
          ...session,
          dataPointCount: actualDataPoints,
          importId: session.importId,
          importName: session.importName,
          sessionStatus: sessionStatus, // Use new coherent status
          importUploadedAt: session.importUploadedAt,
        };
      })
    );

    return NextResponse.json({ sessions: sessionsWithCounts });
  } catch (error) {
    console.error('Error fetching import sessions:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch import sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAdminUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { sessionId, action } = await request.json();
    const db = getDb();

    if (action === 'activate') {
      await db
        .update(importSessions)
        .set({ isActive: 1 })
        .where(eq(importSessions.id, sessionId));
    } else if (action === 'deactivate') {
      await db
        .update(importSessions)
        .set({ isActive: 0 })
        .where(eq(importSessions.id, sessionId));
    } else if (action === 'delete') {
      // Delete data points first
      await db
        .delete(dataPoints)
        .where(eq(dataPoints.importSessionId, sessionId));
      
      // Then delete the session
      await db
        .delete(importSessions)
        .where(eq(importSessions.id, sessionId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating import session:', error);
    return NextResponse.json(
      { error: 'Failed to update import session' },
      { status: 500 }
    );
  }
} 