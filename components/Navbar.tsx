import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Flame } from 'lucide-react';

interface NavbarProps {
  showBackHome?: boolean;
}

export function Navbar({ showBackHome = false }: NavbarProps) {
  return (
    <nav className="w-full border-b border-gray-800/80 bg-gray-950/60 backdrop-blur-xl sticky top-0 z-50">
      <div className="container mx-auto px-4 max-w-5xl h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <Flame className="w-4 h-4 text-indigo-400" />
          </div>
          <span className="text-xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
            OUTBIDS<span className="text-indigo-500">.AUCTION</span>
          </span>
        </Link>

        <div className="flex items-center gap-4 text-xs font-semibold">
          {showBackHome ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Leaderboard</span>
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-5 text-gray-400">
              <Link href="/#how-it-works" className="hover:text-white transition-colors">
                How It Works
              </Link>
              <Link href="/#pricing" className="hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/#faq" className="hover:text-white transition-colors">
                FAQ
              </Link>
              <Link
                href="/terms"
                className="hover:text-white transition-colors"
              >
                Terms
              </Link>
              <Link
                href="/contact"
                className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
              >
                Support
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
