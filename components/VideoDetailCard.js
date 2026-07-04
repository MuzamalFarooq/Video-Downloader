'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Download, Copy, Check, Music, Video as VideoIcon, ExternalLink } from 'lucide-react';
import { YoutubeIcon } from './SocialIcons';
import { formatDuration } from '../lib/utils';
import { useToast } from '../hooks/useToast';

export default function VideoDetailCard({ metadata, onStartDownload }) {
  const [formatType, setFormatType] = useState('video'); // 'video' or 'audio'
  const [selectedFormat, setSelectedFormat] = useState(
    metadata.formats.find(f => f.type === 'video') || metadata.formats[0]
  );
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopyLink = async () => {
    try {
      // Use original video url if present, fallback is just the title/id
      const copyText = metadata.platform === 'youtube' 
        ? `https://youtube.com/watch?v=${metadata.id}` 
        : metadata.id;
      
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast({
        title: 'URL Copied',
        description: 'Video URL copied to clipboard.',
        type: 'success'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      toast({
        title: 'Copy Failed',
        description: 'Unable to write to clipboard.',
        type: 'error'
      });
    }
  };

  const videoFormats = metadata.formats.filter(f => f.type === 'video');
  const audioFormats = metadata.formats.filter(f => f.type === 'audio');

  const handleTypeChange = (type) => {
    setFormatType(type);
    const list = type === 'video' ? videoFormats : audioFormats;
    if (list.length > 0) {
      setSelectedFormat(list[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full max-w-2xl glass-card rounded-3xl p-6 flex flex-col md:flex-row gap-6 shadow-2xl relative overflow-hidden"
    >
      {/* Thumbnail Frame */}
      <div className="w-full md:w-48 h-32 md:h-full relative rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0 group">
        <img
          src={metadata.thumbnail}
          alt={metadata.title}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
        />
        {/* Play Icon Backdrop */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
          <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-white">
            <Play className="w-5 h-5 fill-white" />
          </div>
        </div>
        {/* Duration Badge */}
        <span className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-md px-2 py-0.5 text-[10px] font-bold text-white rounded-md tracking-wider">
          {formatDuration(metadata.duration)}
        </span>
      </div>

      {/* Metadata Detail & Selectors */}
      <div className="flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md tracking-wider flex items-center gap-1.5
              ${metadata.platform === 'youtube' ? 'bg-red-500/10 text-red-500' : 
                metadata.platform === 'vimeo' ? 'bg-sky-500/10 text-sky-500' :
                metadata.platform === 'tiktok' ? 'bg-teal-500/10 text-teal-500' :
                metadata.platform === 'instagram' ? 'bg-pink-500/10 text-pink-500' :
                'bg-zinc-500/10 text-zinc-500'}`}
            >
              {metadata.platform === 'youtube' && <YoutubeIcon className="w-3.5 h-3.5" />}
              {metadata.platform}
            </span>
          </div>

          <h3 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
            {metadata.title}
          </h3>
        </div>

        {/* Video / Audio Switch Tab */}
        <div className="flex flex-col gap-3">
          <div className="flex bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-xl w-fit">
            <button
              onClick={() => handleTypeChange('video')}
              disabled={videoFormats.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors
                ${formatType === 'video' 
                  ? 'bg-white dark:bg-zinc-800 text-primary-indigo dark:text-primary-purple shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
            >
              <VideoIcon className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
            <button
              onClick={() => handleTypeChange('audio')}
              disabled={audioFormats.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors
                ${formatType === 'audio' 
                  ? 'bg-white dark:bg-zinc-800 text-primary-indigo dark:text-primary-purple shadow-sm' 
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'}`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
          </div>

          {/* Formats Pilling grid */}
          <div className="flex flex-wrap gap-2">
            {(formatType === 'video' ? videoFormats : audioFormats).map((f) => (
              <button
                key={`${f.quality}-${f.ext}`}
                onClick={() => setSelectedFormat(f)}
                className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition border flex items-center justify-between gap-3 shadow-sm
                  ${selectedFormat.quality === f.quality && selectedFormat.ext === f.ext
                    ? 'bg-gradient-to-r from-primary-indigo to-primary-purple border-transparent text-white scale-102'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
              >
                <span>{f.quality}</span>
                <span className={`text-[10px] ${selectedFormat.quality === f.quality && selectedFormat.ext === f.ext ? 'text-white/80' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {f.size}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons: Copy & Download */}
        <div className="flex gap-2 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 mt-1">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 transition cursor-pointer text-xs font-semibold"
            title="Copy video link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy Link'}</span>
          </button>

          <button
            onClick={() => onStartDownload(selectedFormat.ext, selectedFormat.quality)}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-50 dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold transition cursor-pointer shadow-md text-xs active:scale-98"
          >
            <Download className="w-4 h-4" />
            <span>Generate Download</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
