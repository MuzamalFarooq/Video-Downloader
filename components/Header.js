'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { DownloadCloud, LayoutDashboard, Link2 } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Downloader', href: '/', icon: Link2 },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/40 bg-white/65 dark:bg-zinc-950/65 backdrop-blur-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Branding Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="p-2 rounded-xl bg-linear-to-tr from-primary-indigo to-primary-purple text-white shadow-md shadow-indigo-500/20 group-hover:scale-102 transition duration-200">
            <DownloadCloud className="w-5 h-5" />
          </div>
          <span className="text-md font-black tracking-tight bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-zinc-50 dark:to-zinc-400 bg-clip-text text-transparent">
            CLIPLY
          </span>
          <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">
            v1.0
          </span>
        </Link>

        {/* Path Nav Tabs */}
        <nav className="flex items-center gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link key={item.href} href={item.href} className="relative py-1.5 px-3 rounded-lg text-xs font-bold transition duration-200 flex items-center gap-1.5">
                {/* Active Indicator Slide Animation */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute inset-0 bg-zinc-100 dark:bg-zinc-850 rounded-xl"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                
                <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-indigo-600 dark:text-purple-400' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-800'}`} />
                <span className={`relative z-10 ${isActive ? 'text-zinc-950 dark:text-zinc-50' : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Utility Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
