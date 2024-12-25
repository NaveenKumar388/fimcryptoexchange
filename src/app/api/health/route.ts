import { testConnections } from '../../../lib/database';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dbConnected = await testConnections();
    
    return NextResponse.json({
      status: dbConnected ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      databases: {
        supabase: dbConnected,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

