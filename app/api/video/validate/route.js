import { NextResponse } from 'next/server';
import { validateVideoUrl, getPlatformFromUrl } from '@/services/videoService';

export async function POST(request) {
  try {
    const { url } = await request.json();
    const isValid = validateVideoUrl(url);
    const platform = isValid ? getPlatformFromUrl(url) : null;
    return NextResponse.json({ isValid, platform });
  } catch (error) {
    return NextResponse.json(
      { isValid: false, error: 'Failed to validate URL' }, 
      { status: 400 }
    );
  }
}
