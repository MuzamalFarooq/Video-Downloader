'use client';

import { motion } from 'framer-motion';
import { YoutubeIcon, VimeoIcon, TiktokIcon, InstagramIcon, TwitterIcon } from './SocialIcons';

const platforms = [
  { name: 'YouTube', icon: YoutubeIcon, color: 'text-red-500 dark:text-red-400 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 dark:bg-red-500/10 dark:hover:bg-red-500/20' },
  { name: 'Vimeo', icon: VimeoIcon, color: 'text-sky-500 dark:text-sky-400 border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 dark:bg-sky-500/10 dark:hover:bg-sky-500/20' },
  { name: 'TikTok', icon: TiktokIcon, color: 'text-teal-500 dark:text-teal-400 border-teal-500/20 bg-teal-500/5 hover:bg-teal-500/10 dark:bg-teal-500/10 dark:hover:bg-teal-500/20' },
  { name: 'Instagram', icon: InstagramIcon, color: 'text-pink-500 dark:text-pink-400 border-pink-500/20 bg-pink-500/5 hover:bg-pink-500/10 dark:bg-pink-500/10 dark:hover:bg-pink-500/20' },
  { name: 'Twitter / X', icon: TwitterIcon, color: 'text-zinc-800 dark:text-zinc-200 border-zinc-500/20 bg-zinc-500/5 hover:bg-zinc-500/10 dark:bg-zinc-500/10 dark:hover:bg-zinc-500/20' },
];

export default function PlatformIcons() {
  return (
    <div className="w-full flex flex-col items-center gap-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
        Supported Streaming Platforms
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        {platforms.map((p, idx) => {
          const Icon = p.icon;
          return (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              className={`flex items-center gap-2 px-4 py-1.8 rounded-full border backdrop-blur-md text-xs font-semibold cursor-default transition-all shadow-sm ${p.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{p.name}</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
