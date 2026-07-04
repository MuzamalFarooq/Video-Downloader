import { validateVideoUrl, getVideoMetadata, getPlatformFromUrl, getFormatsForPlatform } from './videoService';
import { addHistory } from './historyService';
import { downloadWithYtDlp, getYtDlpMetadata } from './ytDlpService';

export async function validateAndFetchMetadata(url) {
  if (!validateVideoUrl(url)) {
    throw new Error('Invalid URL format. Please paste a supported link.');
  }
  
  try {
    return await getVideoMetadata(url);
  } catch (error) {
    console.warn(`[Downloader] Metadata fetch failed: ${error.message}. Attempting yt-dlp fallback...`);
    try {
      const ytMeta = await getYtDlpMetadata(url);
      const platform = getPlatformFromUrl(url);
      return {
        id: ytMeta.id || 'video_id',
        title: ytMeta.title || 'Video Media',
        thumbnail: ytMeta.thumbnail || 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
        duration: ytMeta.duration || 180,
        platform,
        formats: getFormatsForPlatform(platform)
      };
    } catch (ytError) {
      console.error('[Downloader] yt-dlp metadata fallback also failed:', ytError);
      throw error; // throw original error
    }
  }
}

export async function processDownload({ url, format, quality }, onProgress) {
  const metadata = await validateAndFetchMetadata(url);
  
  // Find selected format details to record correct file size
  const formatDetail = metadata.formats.find(
    f => f.ext === format && f.quality === quality
  ) || metadata.formats[0];

  // Execute download with yt-dlp
  const downloadResult = await downloadWithYtDlp(url, format, quality, onProgress);

  const downloadRecord = {
    url,
    title: metadata.title,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    format: format.toUpperCase(),
    quality: formatDetail.quality,
    fileSize: formatDetail.size,
    platform: metadata.platform
  };

  // Save download to history database
  const savedRecord = await addHistory(downloadRecord);

  return {
    success: true,
    record: savedRecord,
    fileUrl: `/api/video/download/file?filename=${encodeURIComponent(downloadResult.filename)}&title=${encodeURIComponent(metadata.title)}&format=${format.toLowerCase()}`
  };
}

