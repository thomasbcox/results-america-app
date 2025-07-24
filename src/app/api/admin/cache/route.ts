import { NextResponse } from 'next/server';
import { clearCache, rebuildCache } from '@/lib/services/adminService';

export async function POST() {
  try {
    console.log('🔄 Starting cache rebuild from admin API...');
    
    // Clear existing cache
    await clearCache();
    console.log('🗑️ Cache cleared');
    
    // Rebuild cache
    await rebuildCache();
    console.log('✅ Cache rebuilt successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cache rebuilt successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error rebuilding cache from admin API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred during cache rebuild',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    console.log('🗑️ Clearing cache from admin API...');
    
    await clearCache();
    
    console.log('✅ Cache cleared successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error clearing cache from admin API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred while clearing cache',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 