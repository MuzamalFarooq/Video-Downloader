import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../hooks/useTheme";
import { ToastProvider } from "../hooks/useToast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = 'https://velocedownloader.com';

export const metadata = {
  metadataBase: new URL(BASE_URL),

  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: 'Veloce Downloader — Free Online Video Downloader & MP3 Converter',
    template: '%s | Veloce Downloader',
  },
  description:
    'Download videos from YouTube, TikTok, Instagram, Vimeo, Facebook & X (Twitter) in HD 1080p/720p MP4 or 320 kbps MP3. Free, fast, no ads, no registration required.',
  keywords: [
    'video downloader',
    'youtube video downloader',
    'tiktok video downloader',
    'instagram reels downloader',
    'facebook video downloader',
    'twitter video downloader',
    'vimeo downloader',
    'mp4 downloader',
    'mp3 converter',
    'youtube to mp3',
    'youtube to mp4',
    'download youtube videos free',
    'hd video downloader',
    '1080p downloader',
    'free online video downloader',
    'no watermark video download',
  ],
  authors: [{ name: 'Muzamal Farooq', url: BASE_URL }],
  creator: 'Al-Farooq Developers',
  publisher: 'Veloce Downloader',
  category: 'Technology',

  // ── Indexing / Crawling ───────────────────────────────────────────────────
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },

  // ── Open Graph (Facebook, LinkedIn, WhatsApp previews) ────────────────────
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: 'Veloce Downloader',
    title: 'Veloce Downloader — Free Online Video Downloader & MP3 Converter',
    description:
      'Instantly download videos from YouTube, TikTok, Instagram & more in HD quality. Free, private, no ads.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Veloce Downloader — Download any video for free',
        type: 'image/png',
      },
    ],
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: 'summary_large_image',
    site: '@velocedownload',
    creator: '@muzamalfarooq',
    title: 'Veloce Downloader — Free HD Video Downloader',
    description:
      'Download YouTube, TikTok, Instagram & more videos in HD MP4 or MP3. Completely free.',
    images: ['/og-image.png'],
  },

  // ── Icons ─────────────────────────────────────────────────────────────────
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [{ url: '/icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};


export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 transition-colors duration-300">
        <ThemeProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

