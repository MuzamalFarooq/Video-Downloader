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

export const metadata = {
  title: "Veloce Downloader | High-Speed Video Downloader & Converter",
  description: "Download high-definition videos instantly from YouTube, Vimeo, TikTok, Instagram, and X (Twitter). Fast, free, secure, and ad-free format conversion.",
  keywords: "video downloader, download youtube video, tiktok download, instagram reels downloader, mp4 downloader, mp3 converter, high speed downloader",
  authors: [{ name: "Antigravity Team" }],
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

