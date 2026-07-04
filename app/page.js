'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Film, Volume2, Download, CheckCircle } from 'lucide-react';
import Header from '../components/Header';
import UrlInputForm from '../components/UrlInputForm';
import PlatformIcons from '../components/PlatformIcons';
import VideoDetailCard from '../components/VideoDetailCard';
import DownloadProgress from '../components/DownloadProgress';

export default function Home() {
  const [stage, setStage] = useState('input'); // 'input', 'resolved', 'downloading'
  const [metadata, setMetadata] = useState(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [progressData, setProgressData] = useState({
    progress: 0,
    speed: '0 KB/s',
    status: 'idle',
    fileUrl: null,
    error: null,
    format: '',
    quality: '',
    title: ''
  });

  const handleStartLoading = () => {
    setIsLoadingMetadata(true);
    setStage('input');
  };

  const handleMetadataFetched = (data) => {
    setIsLoadingMetadata(false);
    if (data) {
      setMetadata(data);
      setStage('resolved');
      // Automatically trigger download using default format
      const defaultFormat = data.formats?.find(f => f.type === 'video') || data.formats?.[0];
      if (defaultFormat) {
        handleStartDownload(defaultFormat.ext, defaultFormat.quality, data);
      }
    } else {
      setMetadata(null);
      setStage('input');
    }
  };

  const handleStartDownload = async (format, quality, videoMetadata = metadata) => {
    if (!videoMetadata) return;

    setStage('downloading');
    setProgressData({
      progress: 0,
      speed: '0 KB/s',
      status: 'connecting',
      fileUrl: null,
      error: null,
      format: format.toUpperCase(),
      quality: quality,
      title: videoMetadata.title
    });

    try {
      // Trigger streaming progress from SSE endpoint
      const copyText = videoMetadata.platform === 'youtube' 
        ? `https://youtube.com/watch?v=${videoMetadata.id}` 
        : videoMetadata.id;

      const urlParams = new URLSearchParams({
        url: copyText,
        format: format.toLowerCase(),
        quality: quality
      });

      const response = await fetch(`/api/video/download?${urlParams.toString()}`);
      if (!response.ok) throw new Error('API request failed to stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let chunkBuffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunkBuffer += decoder.decode(value, { stream: true });
        const lines = chunkBuffer.split('\n\n');
        chunkBuffer = lines.pop() || ''; // Keep trailing incomplete line

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.substring(6));
              
              setProgressData(prev => ({
                ...prev,
                progress: eventData.progress ?? prev.progress,
                speed: eventData.speed ?? prev.speed,
                status: eventData.status ?? prev.status,
                fileUrl: eventData.fileUrl ?? prev.fileUrl,
                error: eventData.error ?? prev.error
              }));

              if (eventData.status === 'failed') {
                throw new Error(eventData.error || 'Conversion stream error');
              }
            } catch (err) {
              console.error('Error parsing SSE event:', err);
            }
          }
        }
      }
    } catch (error) {
      setProgressData(prev => ({
        ...prev,
        status: 'failed',
        error: error.message || 'Unable to establish download connection.'
      }));
    }
  };

  const handleReset = () => {
    setStage('input');
    setMetadata(null);
    setProgressData({
      progress: 0,
      speed: '0 KB/s',
      status: 'idle',
      fileUrl: null,
      error: null,
      format: '',
      quality: '',
      title: ''
    });
  };

  const features = [
    {
      title: 'High-Speed Encoding',
      description: 'Experience lightning-fast file parsing with server-side proxy engines optimized for high-bandwidth downloads.',
      icon: Zap,
      color: 'text-amber-500 bg-amber-500/10'
    },
    {
      title: 'Full HD Quality Support',
      description: 'Convert and download videos in standard high definitions, including 1080p, 720p, or high-fidelity 320kbps MP3 audio.',
      icon: Film,
      color: 'text-indigo-500 bg-indigo-500/10'
    },
    {
      title: 'Flexible File Formats',
      description: 'Easily select formats. Extract rich audio tracks or download full video streams in standard MP4 containers.',
      icon: Volume2,
      color: 'text-pink-500 bg-pink-500/10'
    },
    {
      title: 'Sandboxed Cloud Security',
      description: 'Completely private video processing. No trackers, no pop-up advertisements, and no security permissions leaks.',
      icon: Shield,
      color: 'text-emerald-500 bg-emerald-500/10'
    }
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col gap-16 items-center">
        {/* Hero Section Header */}
        <div className="text-center flex flex-col gap-4 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-fit mx-auto px-3.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/5 dark:bg-indigo-500/10 text-indigo-600 dark:text-purple-400 text-xs font-extrabold uppercase tracking-widest flex items-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5 fill-indigo-500/10" />
            <span>Ultrafast Conversion Engine</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-zinc-50 leading-tight">
            Download Videos <span className="bg-linear-to-r from-primary-indigo to-primary-purple bg-clip-text text-transparent">Instantly</span>
          </h1>
          
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Convert and save streaming media from your favorite social platforms directly to MP4 high definition files or crystal clear MP3 audio.
          </p>
        </div>

        {/* Dynamic Downloader Panel */}
        <div className="w-full flex justify-center">
          <AnimatePresence mode="wait">
            {stage === 'input' && (
              <motion.div
                key="input-stage"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full flex flex-col items-center gap-8"
              >
                <UrlInputForm
                  onMetadataFetched={handleMetadataFetched}
                  onStartLoading={handleStartLoading}
                  isLoading={isLoadingMetadata}
                />
                
                {!isLoadingMetadata && <PlatformIcons />}

                {isLoadingMetadata && (
                  <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider animate-pulse">
                      Analyzing stream metadata...
                    </span>
                  </div>
                )}
              </motion.div>
            )}

            {stage === 'resolved' && metadata && (
              <VideoDetailCard
                key="resolved-stage"
                metadata={metadata}
                onStartDownload={handleStartDownload}
              />
            )}

            {stage === 'downloading' && (
              <DownloadProgress
                key="download-stage"
                progressData={progressData}
                onReset={handleReset}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Features Section */}
        <section className="w-full flex flex-col gap-8 pt-10 border-t border-zinc-200/50 dark:border-zinc-800/40">
          <div className="text-center">
            <h2 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
              Premium Built Features
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              Everything you need to convert and download media without compromises.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, index) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={feat.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shadow-sm flex flex-col gap-3 group hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feat.color} group-hover:scale-105 transition duration-300`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
                    {feat.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/40 py-8 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>© 2026 Veloce Downloader. Created By Muzamal Farooq || Al-Farooq Developers. All rights reserved.</p>
      </footer>
    </div>
  );
}
