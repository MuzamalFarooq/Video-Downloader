'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Heart, ExternalLink, Calendar, HardDrive, Clock, Film, Volume2, ArrowUpDown, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { YoutubeIcon, VimeoIcon, TiktokIcon, InstagramIcon, TwitterIcon } from './SocialIcons';
import { formatDuration, formatDate } from '../lib/utils';
import { useToast } from '../hooks/useToast';

export default function HistoryList({ onRefresh, refreshTrigger }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('all');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const toast = useToast();

  // Load history data whenever filters or the refreshTrigger change
  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          search,
          platform,
          sort,
          page: page.toString(),
          limit: '6'
        });

        const res = await fetch(`/api/history?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to load history');
        
        const data = await res.json();
        setItems(data.history.items);
        setTotalPages(data.history.pages || 1);
        setTotalItems(data.history.total || 0);
        
        if (onRefresh) {
          onRefresh(data.stats); // Bubble stats up to dashboard container
        }
      } catch (err) {
        toast({
          title: 'History Fetch Failed',
          description: err.message || 'Unable to retrieve history log.',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [search, platform, sort, page, refreshTrigger, toast]);

  // Reset page when filters change
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  const handleToggleFavorite = async (id) => {
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Action failed');
      const data = await res.json();

      setItems(prev => prev.map(item => item._id === id ? { ...item, isFavorite: data.item.isFavorite } : item));
      
      toast({
        title: data.item.isFavorite ? 'Added to Favorites' : 'Removed from Favorites',
        description: `Successfully updated item favorite status.`,
        type: 'success'
      });
      
      // Refresh stats
      const queryParams = new URLSearchParams({ search, platform, sort, page: page.toString(), limit: '6' });
      const statsRes = await fetch(`/api/history?${queryParams.toString()}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (onRefresh) onRefresh(statsData.stats);
      }
    } catch (err) {
      toast({
        title: 'Action Failed',
        description: err.message || 'Unable to toggle favorite.',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this download from your history?')) return;
    
    try {
      const res = await fetch(`/api/history/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');

      setItems(prev => prev.filter(item => item._id !== id));
      toast({
        title: 'Item Deleted',
        description: 'Item removed from download history.',
        type: 'success'
      });

      // Refresh data
      const queryParams = new URLSearchParams({ search, platform, sort, page: page.toString(), limit: '6' });
      const statsRes = await fetch(`/api/history?${queryParams.toString()}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setTotalPages(statsData.history.pages || 1);
        setTotalItems(statsData.history.total || 0);
        if (onRefresh) onRefresh(statsData.stats);
      }
    } catch (err) {
      toast({
        title: 'Delete Failed',
        description: err.message || 'Unable to delete history item.',
        type: 'error'
      });
    }
  };

  const platformIcons = {
    youtube: YoutubeIcon,
    vimeo: VimeoIcon,
    tiktok: TiktokIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    other: HelpCircle
  };

  return (
    <div className="w-full flex flex-col gap-5">
      {/* Control Panel: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleFilterChange(setSearch, e.target.value)}
            placeholder="Search saved video titles..."
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:ring-1 focus:ring-primary-indigo"
          />
        </div>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap gap-2">
          {/* Platform filter */}
          <select
            value={platform}
            onChange={(e) => handleFilterChange(setPlatform, e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <option value="all">All Sources</option>
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="tiktok">TikTok</option>
            <option value="instagram">Instagram</option>
            <option value="twitter">Twitter / X</option>
            <option value="other">Others</option>
          </select>

          {/* Sorting */}
          <select
            value={sort}
            onChange={(e) => handleFilterChange(setSort, e.target.value)}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-zinc-700 dark:text-zinc-300 outline-none cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="title">Alphabetical</option>
            <option value="duration">Longest First</option>
          </select>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        /* Skeleton loaders */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg flex-shrink-0" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-4 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-lg" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12 bg-white/40 dark:bg-zinc-950/40 rounded-3xl border border-zinc-200/50 dark:border-zinc-800/40 backdrop-blur-md">
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider mb-2">No Records Found</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
            {search || platform !== 'all' ? 'Try adjusting your filters or search keywords.' : 'No videos have been downloaded yet.'}
          </p>
        </div>
      ) : (
        /* Grid Display */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => {
              const Icon = platformIcons[item.platform] || HelpCircle;
              const isAudio = item.format === 'MP3';
              
              return (
                <motion.div
                  key={item._id}
                  layoutId={item._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between shadow-sm relative group hover:border-zinc-300 dark:hover:border-zinc-700 transition duration-200"
                >
                  {/* Upper Content */}
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-12 relative rounded-lg overflow-hidden bg-zinc-900 flex-shrink-0 border border-zinc-200/50 dark:border-zinc-800/50">
                      <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 bg-black/70 px-1 py-0.5 text-[8px] font-bold text-white rounded">
                        {formatDuration(item.duration)}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                        <span className="text-[10px] font-bold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                          {item.platform}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-100 line-clamp-2 leading-tight">
                        {item.title}
                      </h4>
                    </div>
                  </div>

                  {/* Badges and Info */}
                  <div className="flex flex-wrap items-center gap-1.5 my-3.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1
                      ${isAudio ? 'bg-amber-500/10 text-amber-500' : 'bg-indigo-500/10 text-indigo-500'}`}
                    >
                      {isAudio ? <Volume2 className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                      <span>{item.format}</span>
                    </span>
                    <span className="text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 px-2 py-0.5 rounded-md">
                      {item.quality}
                    </span>
                    <span className="text-[9px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 ml-auto font-medium">
                      <HardDrive className="w-3 h-3" />
                      {item.fileSize}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-3">
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.downloadedAt)}
                    </span>

                    <div className="flex gap-1">
                      {/* Favorite Button */}
                      <button
                        onClick={() => handleToggleFavorite(item._id)}
                        className={`p-1.5 rounded-lg cursor-pointer transition
                          ${item.isFavorite
                            ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                            : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        title={item.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-rose-500' : ''}`} />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/15 cursor-pointer transition"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-zinc-200/50 dark:border-zinc-800/40 pt-4 mt-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold">
            Showing Page <span className="text-zinc-800 dark:text-zinc-200">{page}</span> of {totalPages} ({totalItems} downloads)
          </span>

          <div className="flex gap-1">
            <button
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              disabled={page === 1}
              className={`p-2 rounded-xl border text-zinc-500 transition border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 flex items-center justify-center
                ${page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              disabled={page === totalPages}
              className={`p-2 rounded-xl border text-zinc-500 transition border-zinc-200 dark:border-zinc-800/80 bg-white/40 dark:bg-zinc-950/40 flex items-center justify-center
                ${page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
