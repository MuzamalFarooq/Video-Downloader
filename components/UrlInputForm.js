'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Clipboard, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useToast } from '../hooks/useToast';

export default function UrlInputForm({ onMetadataFetched, onStartLoading, isLoading }) {
  const [url, setUrl] = useState('');
  const [validation, setValidation] = useState({ isValid: null, platform: null });
  const [isChecking, setIsChecking] = useState(false);
  const toast = useToast();

  // Validate URL as the user types
  useEffect(() => {
    if (!url) {
      setValidation({ isValid: null, platform: null });
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsChecking(true);
      try {
        const res = await fetch('/api/video/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const data = await res.json();
        setValidation({ isValid: data.isValid, platform: data.platform });
      } catch (_) {
        setValidation({ isValid: false, platform: null });
      } finally {
        setIsChecking(false);
      }
    }, 400); // Debounce API calls

    return () => clearTimeout(delayDebounce);
  }, [url]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        toast({
          title: 'Link pasted',
          description: 'URL successfully copied from clipboard.',
          type: 'success'
        });
      }
    } catch (_) {
      toast({
        title: 'Paste Failed',
        description: 'Unable to access clipboard. Please paste manually.',
        type: 'error'
      });
    }
  };

  const handleClear = () => {
    setUrl('');
    setValidation({ isValid: null, platform: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url || !validation.isValid) return;

    onStartLoading();
    try {
      const res = await fetch('/api/video/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to fetch video details');
      }

      const data = await res.json();
      onMetadataFetched(data);
      toast({
        title: 'Video resolved',
        description: 'Successfully fetched video metadata. Select your format to download.',
        type: 'success'
      });
    } catch (err) {
      onMetadataFetched(null);
      toast({
        title: 'Failed to Fetch Video',
        description: err.message || 'Something went wrong while loading video information.',
        type: 'error'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl flex flex-col gap-3">
      <div className="relative group">
        {/* Glow Background Effect */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary-indigo to-primary-purple rounded-2xl opacity-30 group-focus-within:opacity-60 blur transition duration-300"></div>

        {/* Input Card Container */}
        <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-2 pl-4 gap-2 transition duration-200 shadow-lg">
          <Link className="w-5 h-5 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
          
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube, Vimeo, TikTok, Instagram or X link here..."
            className="w-full bg-transparent border-0 outline-none text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 py-2.5 focus:ring-0"
            disabled={isLoading}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {url ? (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer rounded-xl transition"
                disabled={isLoading}
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePaste}
                className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer rounded-xl transition hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                disabled={isLoading}
                title="Paste from clipboard"
              >
                <Clipboard className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={!url || !validation.isValid || isLoading || isChecking}
              className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs transition cursor-pointer select-none
                ${url && validation.isValid && !isLoading
                  ? 'bg-gradient-to-r from-primary-indigo to-primary-purple text-white hover:opacity-95 shadow-md shadow-indigo-500/20 active:scale-98'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed'
                }`}
            >
              <span>{isLoading ? 'Fetching...' : 'Analyze'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Validation Banner Indicator */}
      <AnimatePresence>
        {url && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="flex items-center pl-4 text-xs font-medium"
          >
            {isChecking ? (
              <div className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-3.5 h-3.5 rounded-full border border-t-transparent border-zinc-400 animate-spin"></span>
                <span>Verifying streaming source...</span>
              </div>
            ) : validation.isValid ? (
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <CheckCircle className="w-3.5 h-3.5" />
                <span className="capitalize">{validation.platform} video url recognized</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-rose-500 dark:text-rose-400">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Unsupported or invalid media link format</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
