import { NextResponse } from 'next/server';
import { clearCache, rebuildCache } from '@/lib/services/adminService';

export async function DELETE() {
  try {
    await clearCache();
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    await rebuildCache();
    return NextResponse.json({ 
      message: 'Cache rebuilt successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error rebuilding cache:', error);
    return NextResponse.json(
      { error: 'Failed to rebuild cache' },
      { status: 500 }
    );
  }
} 