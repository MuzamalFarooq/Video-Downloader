import { processDownload } from '@/services/downloaderService';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const format = searchParams.get('format') || 'mp4';
  const quality = searchParams.get('quality') || '720p';

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL query parameter is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {
          // Client might have disconnected, ignore
        }
      };

      try {
        sendEvent({ status: 'connecting', progress: 0, speed: '0 KB/s' });

        // Kick off real download engine request asynchronously
        processDownload({ url, format, quality }, (progressInfo) => {
          sendEvent({
            status: progressInfo.status,
            progress: progressInfo.progress,
            speed: progressInfo.speed
          });
        })
          .then((res) => {
            sendEvent({
              status: 'completed',
              progress: 100,
              speed: '0 MB/s',
              fileUrl: res.fileUrl,
              record: res.record
            });
            controller.close();
          })
          .catch((err) => {
            sendEvent({ 
              status: 'failed', 
              error: err.message || 'Download resolution failed' 
            });
            controller.close();
          });
      } catch (error) {
        sendEvent({ status: 'failed', error: error.message || 'Download resolution failed' });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

