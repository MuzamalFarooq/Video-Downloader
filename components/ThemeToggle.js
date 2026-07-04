'use client';

import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileHover={{ scale: 1.08, rotate: 12 }}
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md text-zinc-800 dark:text-zinc-200 shadow-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
      aria-label="Toggle Theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-amber-500 fill-amber-500/20" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-600 fill-indigo-600/10" />
      )}
    </motion.button>
  );
}
