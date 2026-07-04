import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');
    const title = searchParams.get('title') || 'Video_Download';
    const format = searchParams.get('format') || 'mp4';

    if (!filename) {
      return NextResponse.json({ error: 'Filename query parameter is required' }, { status: 400 });
    }

    // Clean filename to prevent directory traversal
    const cleanFilename = path.basename(filename);
    const downloadsDir = process.env.DOWNLOADS_DIR || path.join(process.cwd(), 'downloads');
    const filePath = path.join(downloadsDir, cleanFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'Requested file not found or has expired' }, { status: 404 });
    }

    const stats = fs.statSync(filePath);
    const cleanTitle = title.replace(/[/\\?%*:|"<>]/g, '_');
    const safeFilename = `${cleanTitle}.${format}`;

    // Create a Web ReadableStream from the Node ReadStream
    const nodeStream = fs.createReadStream(filePath);
    
    const cleanupFile = () => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`[File Proxy] Cleaned up temporary file: ${cleanFilename}`);
        }
      } catch (err) {
        console.error(`[File Proxy] Error deleting temporary file ${cleanFilename}:`, err);
      }
    };

    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => {
          try {
            controller.enqueue(chunk);
          } catch (_) {
            // Controller might be closed
          }
        });
        nodeStream.on('end', () => {
          try {
            controller.close();
          } catch (_) {}
          cleanupFile();
        });
        nodeStream.on('error', (err) => {
          try {
            controller.error(err);
          } catch (_) {}
          cleanupFile();
        });
      },
      cancel() {
        nodeStream.destroy();
        cleanupFile();
      }
    });

    const headers = new Headers();
    const contentType = format === 'mp3' ? 'audio/mpeg' : 'video/mp4';

    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(safeFilename)}"`);
    headers.set('Content-Length', stats.size.toString());
    headers.set('Cache-Control', 'no-cache, no-transform');

    return new Response(stream, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('File proxy stream failure:', error);
    return NextResponse.json(
      { error: 'Engine failed to stream media file content.' },
      { status: 500 }
    );
  }
}

