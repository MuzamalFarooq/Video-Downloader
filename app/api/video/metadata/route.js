import { NextResponse } from 'next/server';
import { validateAndFetchMetadata } from '@/services/downloaderService';

export async function POST(request) {
  try {
    const { url } = await request.json();
    const metadata = await validateAndFetchMetadata(url);
    return NextResponse.json(metadata);
  } catch (error) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch video metadata' }, 
      { status: 400 }
    );
  }
}
