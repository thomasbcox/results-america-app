import { NextResponse } from 'next/server';
import { getSystemStats, checkDataIntegrity } from '@/lib/services/adminService';

export async function GET() {
  try {
    const [stats, integrity] = await Promise.all([
      getSystemStats(),
      checkDataIntegrity()
    ]);

    return NextResponse.json({
      stats,
      integrity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin statistics' },
      { status: 500 }
    );
  }
} 