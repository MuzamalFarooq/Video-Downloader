'use client';

import { useState } from 'react';
import Header from '../../components/Header';
import StatsDashboard from '../../components/StatsDashboard';
import HistoryList from '../../components/HistoryList';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDownloads: 0,
    totalSizeSaved: '0.0 MB',
    favoritesCount: 0,
    platformDistribution: {}
  });

  const handleRefreshStats = (newStats) => {
    if (newStats) {
      setStats(newStats);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
            System Dashboard
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Monitor conversion speeds, storage saved, platform ratios, and search history archives.
          </p>
        </div>

        {/* KPI metrics cards and platform graphs */}
        <StatsDashboard stats={stats} />

        {/* History List containing search and paging controls */}
        <div className="flex flex-col gap-4 mt-4 border-t border-zinc-200/50 dark:border-zinc-800/40 pt-8">
          <div>
            <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Conversion Logs Archive
            </h2>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
              Interact with logs, filter by stream platform source, or bookmark files.
            </p>
          </div>
          <HistoryList onRefresh={handleRefreshStats} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/50 dark:border-zinc-800/40 py-8 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md text-center text-xs text-zinc-400 dark:text-zinc-500">
        <p>© 2026 Veloce Downloader. Created with Next.js 15+, Tailwind CSS, Mongoose & Mocks. All rights reserved.</p>
      </footer>
    </div>
  );
}
