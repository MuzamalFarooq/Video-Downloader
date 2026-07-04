'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, AlertCircle, RefreshCw, Disc, Loader } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function DownloadProgress({ progressData, onReset }) {
  const { progress, speed, status, fileUrl, error, format, quality, title } = progressData;
  const [downloadTriggered, setDownloadTriggered] = useState(false);
  const toast = useToast();

  // Auto trigger the download file prompt when completed
  useEffect(() => {
    if (status === 'completed' && fileUrl && !downloadTriggered) {
      setDownloadTriggered(true);
      
      // Auto click standard download anchor link
      const a = document.createElement('a');
      a.href = fileUrl;
      a.setAttribute('download', '');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      toast({
        title: 'Download Started',
        description: `Your converted file "${title}" is ready.`,
        type: 'success'
      });
    }
  }, [status, fileUrl, downloadTriggered, title, toast]);

  const handleManualDownload = () => {
    if (!fileUrl) return;
    const a = document.createElement('a');
    a.href = fileUrl;
    a.setAttribute('download', '');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl glass-card rounded-3xl p-6 shadow-2xl flex flex-col gap-5 border border-zinc-200 dark:border-zinc-800/80"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
            Conversion Queue
          </span>
          <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
            {title}
          </h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Format: <span className="font-bold text-zinc-700 dark:text-zinc-300">{format}</span> • Quality: <span className="font-bold text-zinc-700 dark:text-zinc-300">{quality}</span>
          </p>
        </div>

        {/* Dynamic Status Badges */}
        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full flex items-center gap-1 flex-shrink-0
          ${status === 'completed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
            status === 'failed' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
            'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-pulse'}`}
        >
          {status === 'downloading' && <Disc className="w-3 h-3 animate-spin" />}
          {status === 'connecting' && <Loader className="w-3 h-3 animate-spin" />}
          {status === 'completed' && <CheckCircle className="w-3 h-3" />}
          {status === 'failed' && <AlertCircle className="w-3 h-3" />}
          {status}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-zinc-500 dark:text-zinc-400">
            {status === 'completed' ? 'Processed successfully' : 
             status === 'failed' ? 'Process aborted' : 
             'Downloading streams...'}
          </span>
          <span className="text-zinc-900 dark:text-zinc-100">{progress}%</span>
        </div>

        {/* Animated Progress Tracks */}
        <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative shadow-inner">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full rounded-full bg-gradient-to-r from-primary-indigo to-primary-purple shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          />
        </div>

        {/* Speed and Size info */}
        <div className="flex justify-between text-xs mt-1 text-zinc-500 dark:text-zinc-400">
          <span>Speed: <span className="font-bold text-zinc-700 dark:text-zinc-300">{speed}</span></span>
          {status === 'downloading' && <span>Remaining: ~{Math.max(1, Math.round((100 - progress) / 12))}s</span>}
        </div>
      </div>

      {/* Error state */}
      {status === 'failed' && (
        <div className="p-3 bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-rose-500 text-xs font-semibold leading-normal">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Error: {error || 'Stream connection closed unexpectedly.'}</span>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex gap-2 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 mt-1">
        <button
          onClick={onReset}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 hover:bg-zinc-50 dark:hover:bg-zinc-900/60 text-zinc-700 dark:text-zinc-300 font-bold transition cursor-pointer text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Convert another URL</span>
        </button>

        {status === 'completed' && (
          <button
            onClick={handleManualDownload}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-indigo to-primary-purple text-white font-bold transition cursor-pointer shadow-md text-xs hover:opacity-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save File</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
