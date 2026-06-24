import { NextRequest, NextResponse } from 'next/server';
import { getLogs } from '@/lib/logs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '50', 10) || 50, 1), 500);
  const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0);

  const result = getLogs(limit, offset);
  return NextResponse.json(result);
}
