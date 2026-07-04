import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

const BIN_DIR = path.join(process.cwd(), 'bin');
// Use DOWNLOADS_DIR env var on production (e.g. /tmp/downloads on Render/Docker)
// Falls back to local downloads/ folder in development
const DOWNLOADS_DIR = process.env.DOWNLOADS_DIR || path.join(process.cwd(), 'downloads');


// Get the ffmpeg executable directory
export function getFfmpegDir() {
  if (ffmpegPath) {
    return path.dirname(ffmpegPath);
  }
  return null;
}

// Get correct yt-dlp binary name and download URL for the current platform
function getYtDlpPlatformConfig() {
  // If YTDLP_PATH is set (e.g. on a VPS/Docker: /usr/local/bin/yt-dlp), use it directly.
  // This is required for production deployments where yt-dlp is installed system-wide.
  if (process.env.YTDLP_PATH) {
    return { binaryPath: process.env.YTDLP_PATH, downloadUrl: null };
  }

  const platform = process.platform;
  let binaryName = 'yt-dlp';
  let downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';

  if (platform === 'win32') {
    binaryName = 'yt-dlp.exe';
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';
  } else if (platform === 'darwin') {
    binaryName = 'yt-dlp_macos';
    downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos';
  }

  return {
    binaryPath: path.join(BIN_DIR, binaryName),
    downloadUrl
  };
}

// Ensure the yt-dlp binary exists, downloading it if necessary.
// If YTDLP_PATH env var is set, assumes the binary already exists at that path (no download).
export async function ensureYtDlp() {
  const { binaryPath, downloadUrl } = getYtDlpPlatformConfig();

  // If using a system-installed binary (set via YTDLP_PATH), trust it exists
  if (process.env.YTDLP_PATH) {
    if (!fs.existsSync(binaryPath)) {
      throw new Error(`YTDLP_PATH is set to "${binaryPath}" but the binary was not found. Please install yt-dlp on the server.`);
    }
    return binaryPath;
  }

  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  if (fs.existsSync(binaryPath)) {
    return binaryPath;
  }

  console.log(`[yt-dlp] Downloading binary from ${downloadUrl}...`);
  
  const response = await fetch(downloadUrl);
  if (!response.ok) {
    throw new Error(`Failed to download yt-dlp binary from GitHub: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const fileStream = fs.createWriteStream(binaryPath);

  await new Promise((resolve, reject) => {
    fileStream.on('error', reject);
    fileStream.on('finish', resolve);

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fileStream.write(Buffer.from(value));
        }
        fileStream.end();
      } catch (err) {
        fileStream.destroy(err);
        reject(err);
      }
    })();
  });

  // Set executable permissions for macOS and Linux
  if (process.platform !== 'win32') {
    fs.chmodSync(binaryPath, 0o755);
  }

  console.log(`[yt-dlp] Binary downloaded and saved to ${binaryPath}`);
  return binaryPath;
}

// Get video metadata using yt-dlp --dump-json
export async function getYtDlpMetadata(url) {
  const binaryPath = await ensureYtDlp();
  const ffmpegDir = getFfmpegDir();

  const args = ['--dump-json', '--no-playlist'];
  if (ffmpegDir) {
    args.push('--ffmpeg-location', ffmpegDir);
  }
  args.push(url);

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args);
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `yt-dlp metadata failed with exit code ${code}`));
        return;
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse metadata JSON: ${err.message}`));
      }
    });
  });
}

// Download video using yt-dlp with progress callback
export async function downloadWithYtDlp(url, format, quality, onProgress) {
  const binaryPath = await ensureYtDlp();
  const ffmpegDir = getFfmpegDir();

  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }

  const uniqueId = `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const ext = format.toLowerCase();
  const finalFilename = `${uniqueId}.${ext}`;
  const finalPath = path.join(DOWNLOADS_DIR, finalFilename);

  // Template for temporary/final output file
  const outputTemplate = path.join(DOWNLOADS_DIR, `${uniqueId}.%(ext)s`);

  const args = [
    url,
    '-o', outputTemplate,
    '--no-playlist',
    '--newline',
    '--progress'
  ];

  if (ffmpegDir) {
    args.push('--ffmpeg-location', ffmpegDir);
  }

  const isAudio = ext === 'mp3';

  if (isAudio) {
    args.push('-f', 'bestaudio');
    args.push('--extract-audio');
    args.push('--audio-format', 'mp3');
    if (quality.includes('320')) {
      args.push('--audio-quality', '320K');
    } else {
      args.push('--audio-quality', '128K');
    }
  } else {
    // Video quality selection mapping
    let height = 720;
    if (quality.includes('1080')) height = 1080;
    else if (quality.includes('480')) height = 480;
    else if (quality.includes('360')) height = 360;

    args.push('-f', `bestvideo[height<=${height}]+bestaudio/best[height<=${height}]/best`);
    args.push('--merge-output-format', 'mp4');
  }

  console.log(`[yt-dlp] Spawning download: ${binaryPath} ${args.join(' ')}`);

  return new Promise((resolve, reject) => {
    const child = spawn(binaryPath, args);
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      const lines = text.split(/[\r\n]+/);
      for (const line of lines) {
        if (!line.trim()) continue;

        // Parse progress line e.g., "[download]  12.5% of 45.21MiB at 4.21MiB/s ETA 00:08"
        if (line.includes('[download]')) {
          const percentMatch = line.match(/(\d+(?:\.\d+)?)%/);
          const speedMatch = line.match(/at\s+([^\s]+)/);

          const progress = percentMatch ? Math.round(parseFloat(percentMatch[1])) : null;
          const speed = speedMatch ? speedMatch[1] : null;

          if (progress !== null) {
            onProgress({
              status: progress === 100 ? 'processing' : 'downloading',
              progress,
              speed: speed || 'Estimating...'
            });
          }
        } else if (
          line.includes('[ffmpeg]') || 
          line.includes('[ExtractAudio]') || 
          line.includes('[Merger]') ||
          line.includes('[VideoConvertor]')
        ) {
          // If post-processing or converting format via FFmpeg
          onProgress({
            status: 'processing',
            progress: 95,
            speed: 'Processing...'
          });
        }
      }
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || `Download process exited with code ${code}`));
        return;
      }

      // Verify that the file was created and is available
      if (fs.existsSync(finalPath)) {
        resolve({
          filePath: finalPath,
          filename: finalFilename
        });
      } else {
        // Find if it was downloaded with a different extension or name
        // Sometimes bestvideo+bestaudio formats might keep their own extension if merging fails
        // We look for files matching the uniqueId in downloads/
        const files = fs.readdirSync(DOWNLOADS_DIR);
        const matchedFile = files.find(f => f.startsWith(uniqueId));
        if (matchedFile) {
          resolve({
            filePath: path.join(DOWNLOADS_DIR, matchedFile),
            filename: matchedFile
          });
        } else {
          reject(new Error('Downloaded file could not be located in output directory.'));
        }
      }
    });
  });
}
