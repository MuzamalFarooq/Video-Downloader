export const PLATFORMS = {
  YOUTUBE: 'youtube',
  VIMEO: 'vimeo',
  TIKTOK: 'tiktok',
  INSTAGRAM: 'instagram',
  TWITTER: 'twitter',
  OTHER: 'other'
};

const YOUTUBE_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([\w-]{11})/;
const VIMEO_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:vimeo\.com\/)(\d+)/;
const TIKTOK_REGEX = /^(?:https?:\/\/)?(?:www\.|vt\.)?(?:tiktok\.com\/)(?:t\/|@[\w.]+\/video\/)?(\d+)/;
const INSTAGRAM_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)(?:p|reel|tv)\/([\w-]+)/;
const TWITTER_REGEX = /^(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/;

export function getPlatformFromUrl(url) {
  if (!url) return PLATFORMS.OTHER;
  const lowercaseUrl = url.toLowerCase();
  if (YOUTUBE_REGEX.test(url)) return PLATFORMS.YOUTUBE;
  if (VIMEO_REGEX.test(url)) return PLATFORMS.VIMEO;
  if (TIKTOK_REGEX.test(url)) return PLATFORMS.TIKTOK;
  if (INSTAGRAM_REGEX.test(url)) return PLATFORMS.INSTAGRAM;
  if (TWITTER_REGEX.test(url) || lowercaseUrl.includes('x.com')) return PLATFORMS.TWITTER;
  return PLATFORMS.OTHER;
}

export function extractYoutubeId(url) {
  const match = url.match(YOUTUBE_REGEX);
  return match ? match[1] : null;
}

export function extractVimeoId(url) {
  const match = url.match(VIMEO_REGEX);
  return match ? match[1] : null;
}

export function validateVideoUrl(url) {
  if (!url) return false;
  
  // Basic URL regex
  try {
    new URL(url);
  } catch (_) {
    return false;
  }

  const platform = getPlatformFromUrl(url);
  return platform !== PLATFORMS.OTHER || url.includes('.') ;
}

export async function getVideoMetadata(url) {
  if (!validateVideoUrl(url)) {
    throw new Error('Invalid URL format');
  }

  const platform = getPlatformFromUrl(url);
  
  let title = null;
  let thumbnail = null;
  let duration = 0;
  let author = null;

  // oEmbed targets
  let oembedUrl = null;
  if (platform === PLATFORMS.YOUTUBE) {
    oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  } else if (platform === PLATFORMS.VIMEO) {
    oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
  } else if (platform === PLATFORMS.TIKTOK) {
    oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  } else if (platform === PLATFORMS.TWITTER) {
    oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}`;
  }

  if (oembedUrl) {
    try {
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        title = data.title;
        thumbnail = data.thumbnail_url;
        author = data.author_name;
      }
    } catch (e) {
      console.error('oEmbed fetch error:', e);
    }
  }

  // Scrape HTML for fallback title, thumbnail, and duration
  try {
    const htmlRes = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(6000)
    });
    if (htmlRes.ok) {
      const html = await htmlRes.text();

      // Extract title if oEmbed didn't get it
      if (!title) {
        const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);
        if (ogTitleMatch) title = ogTitleMatch[1];
        
        if (!title) {
          const twitterTitleMatch = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i) ||
                                    html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:title["']/i);
          if (twitterTitleMatch) title = twitterTitleMatch[1];
        }

        if (!title) {
          const titleTagMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          if (titleTagMatch) title = titleTagMatch[1];
        }
      }

      // Extract thumbnail if oEmbed didn't get it
      if (!thumbnail) {
        const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
                             html.match(/<meta[^>]+content=["']([^"']+)["']/i) ||
                             html.match(/<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i);
        if (ogImageMatch) thumbnail = ogImageMatch[1];

        if (!thumbnail) {
          const twitterImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i) ||
                                     html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i);
          if (twitterImageMatch) thumbnail = twitterImageMatch[1];
        }
      }

      // Extract duration
      const durationMatch = html.match(/<meta[^>]+itemprop=["']duration["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+itemprop=["']duration["']/i) ||
                            html.match(/<meta[^>]+property=["']video:duration["'][^>]+content=["']([^"']+)["']/i) ||
                            html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']video:duration["']/i);
      if (durationMatch) {
        const val = durationMatch[1];
        if (val.startsWith('PT')) {
          duration = parseISO8601Duration(val);
        } else {
          duration = parseInt(val) || 0;
        }
      }
    }
  } catch (e) {
    console.error('HTML scrape error:', e);
  }

  // HTML entity decode title
  if (title) {
    title = decodeHtmlEntities(title.trim());
  }

  // Use platform-specific placeholders if everything else fails
  const fallbackDetails = getFallbackDetails(platform, url);
  title = title || fallbackDetails.title;
  thumbnail = thumbnail || fallbackDetails.thumbnail;
  duration = duration || fallbackDetails.duration;

  // Construct formats based on platform
  const formats = getFormatsForPlatform(platform);
  const videoId = extractIdForPlatform(platform, url);

  return {
    id: videoId || 'video_id',
    title,
    thumbnail,
    duration,
    platform,
    formats
  };
}

function parseISO8601Duration(durationStr) {
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0');
  const minutes = parseInt(match[2] || '0');
  const seconds = parseInt(match[3] || '0');
  return hours * 3600 + minutes * 60 + seconds;
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&ldquo;/g, '“')
    .replace(/&rdquo;/g, '”')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rsquo;/g, '’');
}

function extractIdForPlatform(platform, url) {
  if (platform === PLATFORMS.YOUTUBE) return extractYoutubeId(url);
  if (platform === PLATFORMS.VIMEO) return extractVimeoId(url);
  
  try {
    const parsedUrl = new URL(url);
    const paths = parsedUrl.pathname.split('/').filter(Boolean);
    if (paths.length > 0) return paths[paths.length - 1];
  } catch (_) {}
  
  return 'video_id';
}

function getFallbackDetails(platform, url) {
  switch (platform) {
    case PLATFORMS.YOUTUBE:
      return {
        title: 'YouTube Video',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        duration: 180
      };
    case PLATFORMS.VIMEO:
      return {
        title: 'Vimeo Video Showcase',
        thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
        duration: 240
      };
    case PLATFORMS.TIKTOK:
      return {
        title: 'TikTok Viral Clip',
        thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=800&q=80',
        duration: 30
      };
    case PLATFORMS.INSTAGRAM:
      return {
        title: 'Instagram Reels Media',
        thumbnail: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
        duration: 60
      };
    case PLATFORMS.TWITTER:
      return {
        title: 'X / Twitter Video Stream',
        thumbnail: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=800&q=80',
        duration: 120
      };
    default:
      return {
        title: 'External Web Media Stream',
        thumbnail: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
        duration: 180
      };
  }
}

export function getFormatsForPlatform(platform) {
  switch (platform) {
    case PLATFORMS.YOUTUBE:
      return [
        { quality: '1080p', ext: 'mp4', size: '54.2 MB', type: 'video' },
        { quality: '720p', ext: 'mp4', size: '28.1 MB', type: 'video' },
        { quality: '360p', ext: 'mp4', size: '10.5 MB', type: 'video' },
        { quality: '320kbps', ext: 'mp3', size: '12.8 MB', type: 'audio' },
        { quality: '128kbps', ext: 'mp3', size: '5.1 MB', type: 'audio' }
      ];
    case PLATFORMS.VIMEO:
      return [
        { quality: '1080p', ext: 'mp4', size: '22.5 MB', type: 'video' },
        { quality: '720p', ext: 'mp4', size: '11.8 MB', type: 'video' },
        { quality: '320kbps', ext: 'mp3', size: '3.7 MB', type: 'audio' }
      ];
    case PLATFORMS.TIKTOK:
      return [
        { quality: '720p (No Watermark)', ext: 'mp4', size: '6.4 MB', type: 'video' },
        { quality: '720p (With Watermark)', ext: 'mp4', size: '7.1 MB', type: 'video' },
        { quality: '128kbps', ext: 'mp3', size: '0.7 MB', type: 'audio' }
      ];
    case PLATFORMS.INSTAGRAM:
      return [
        { quality: '720p', ext: 'mp4', size: '9.2 MB', type: 'video' },
        { quality: '128kbps', ext: 'mp3', size: '0.9 MB', type: 'audio' }
      ];
    case PLATFORMS.TWITTER:
      return [
        { quality: '720p', ext: 'mp4', size: '15.4 MB', type: 'video' },
        { quality: '480p', ext: 'mp4', size: '7.8 MB', type: 'video' },
        { quality: '128kbps', ext: 'mp3', size: '1.7 MB', type: 'audio' }
      ];
    default:
      return [
        { quality: 'Source Resolution', ext: 'mp4', size: '25.0 MB', type: 'video' },
        { quality: '128kbps Audio', ext: 'mp3', size: '4.8 MB', type: 'audio' }
      ];
  }
}
