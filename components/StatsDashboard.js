'use client';

import { motion } from 'framer-motion';
import { DownloadCloud, HardDrive, Heart, BarChart3, HelpCircle } from 'lucide-react';
import { YoutubeIcon, VimeoIcon, TiktokIcon, InstagramIcon, TwitterIcon } from './SocialIcons';

export default function StatsDashboard({ stats }) {
  const { totalDownloads, totalSizeSaved, favoritesCount, platformDistribution = {} } = stats;

  const platformIcons = {
    youtube: YoutubeIcon,
    vimeo: VimeoIcon,
    tiktok: TiktokIcon,
    instagram: InstagramIcon,
    twitter: TwitterIcon,
    other: HelpCircle
  };

  const platformColors = {
    youtube: 'bg-red-500',
    vimeo: 'bg-sky-500',
    tiktok: 'bg-teal-500',
    instagram: 'bg-pink-500',
    twitter: 'bg-zinc-800 dark:bg-zinc-200',
    other: 'bg-zinc-500'
  };

  // Convert distribution into array and calculate percentages
  const distributionArray = Object.entries(platformDistribution).map(([platform, count]) => ({
    name: platform,
    count,
    percentage: totalDownloads > 0 ? Math.round((count / totalDownloads) * 100) : 0
  })).sort((a, b) => b.count - a.count);

  const kpis = [
    {
      title: 'Total Downloads',
      value: totalDownloads,
      icon: DownloadCloud,
      color: 'from-blue-500 to-indigo-500',
      shadow: 'shadow-blue-500/10'
    },
    {
      title: 'Storage Saved',
      value: totalSizeSaved,
      icon: HardDrive,
      color: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/10'
    },
    {
      title: 'Favorites Saved',
      value: favoritesCount,
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      shadow: 'shadow-rose-500/10'
    }
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shadow-sm ${kpi.shadow} flex items-center justify-between group`}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                  {kpi.title}
                </span>
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-50">
                  {kpi.value}
                </span>
              </div>
              <div className={`p-3.5 rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-md group-hover:scale-105 transition duration-300`}>
                <Icon className="w-5 h-5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Platform Distribution Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="p-5 rounded-2xl border border-zinc-200/50 dark:border-zinc-800/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shadow-sm flex flex-col gap-4"
      >
        <div className="flex items-center gap-2 border-b border-zinc-200/50 dark:border-zinc-800/40 pb-3">
          <BarChart3 className="w-4 h-4 text-primary-indigo dark:text-primary-purple" />
          <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Distribution by Platform
          </h4>
        </div>

        {distributionArray.length === 0 ? (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 py-4 text-center">
            No platform statistics compiled yet. Complete some downloads to populate graphs.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {distributionArray.map((item) => {
              const Icon = platformIcons[item.name] || HelpCircle;
              const barColor = platformColors[item.name] || 'bg-zinc-500';
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
                      <Icon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                      <span className="capitalize">{item.name}</span>
                    </div>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>

                  {/* Horizontal Bar Chart */}
                  <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={`h-full rounded-full ${barColor}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
