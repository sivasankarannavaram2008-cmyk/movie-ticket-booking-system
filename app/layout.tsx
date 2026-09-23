import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { CityProvider } from "@/context/CityContext";
import { Database, Layers } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "My Movie Booking | Cinema Tickets, Showtimes & Releases",
  description:
    "Book movie tickets online across top metropolitan theaters with instant confirmation and interactive seat matrices.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-background text-foreground flex flex-col`}>
        <CityProvider>
          {/* Navigation Bar with Suspense for useSearchParams */}
          <Suspense
            fallback={
              <div className="h-16 w-full bg-zinc-950 border-b border-zinc-800 animate-pulse flex items-center px-8">
                <div className="h-8 w-32 bg-zinc-800 rounded" />
              </div>
            }
          >
            <Navbar />
          </Suspense>

          {/* Main Content */}
          <main className="flex-1">{children}</main>
        </CityProvider>

        {/* Footer */}
        <footer className="border-t border-zinc-850 bg-zinc-950 py-8 text-center text-xs text-zinc-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6">
              <span className="font-bold text-white tracking-wide">
                My <span className="text-primary">Movie</span> Booking
              </span>
              <span>© {new Date().getFullYear()} My Movie Booking Inc. All Rights Reserved.</span>
            </div>
            <div className="flex items-center gap-5 text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-zinc-400" /> Supabase PostgreSQL
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-zinc-400" /> Upstash Redis
              </span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
