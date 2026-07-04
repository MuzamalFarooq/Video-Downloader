import { NextResponse } from 'next/server';
import { getHistory, getStats, addHistory } from '@/services/historyService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const platform = searchParams.get('platform') || 'all';
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const historyData = await getHistory({ search, platform, sort, page, limit });
    const statsData = await getStats();

    return NextResponse.json({
      history: historyData,
      stats: statsData,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch history and stats' }, 
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const record = await request.json();
    const saved = await addHistory(record);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to save history item' }, 
      { status: 500 }
    );
  }
}
