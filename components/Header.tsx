'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, ArrowUpRight, Radio } from 'lucide-react';
import { formatCentsToDollars } from '@/utils/formatters';

interface HeaderProps {
  isConnected: boolean;
  totalBids: number;
  highestBidCents: number;
  totalVolumeCents: number;
}

export function Header({
  isConnected,
  totalBids,
  highestBidCents,
  totalVolumeCents,
}: HeaderProps) {
  return (
    <header className="border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between text-sm">
        {/* Brand & Nav */}
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="font-extrabold text-lg sm:text-xl flex items-center tracking-tight">
            <span className="text-gray-900 font-black">OutBids</span>
            <span className="text-[#FF4B4B]">.auction</span>
          </Link>
          <nav className="hidden md:flex gap-5 text-gray-500 text-xs font-semibold">
            <Link href="/" className="text-gray-900 font-bold hover:text-[#FF4B4B] transition-colors">
              Leaderboard
            </Link>
            <a href="#rules" className="hover:text-gray-900 transition-colors">
              Rules
            </a>
            <Link href="/history" className="hover:text-gray-900 transition-colors">
              History
            </Link>
          </nav>
        </div>

        {/* Live Metrics & Quick Links */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 font-mono">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="font-sans font-medium text-gray-700">{isConnected ? 'LIVE' : 'Connecting...'}</span>
            </span>
            <span className="text-gray-200">|</span>
            <span>{totalBids} listings</span>
            <span className="text-gray-200">|</span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#FF4B4B] bg-[#FFF5F3] px-2 py-0.5 rounded border border-[#FFE4E0]">
              TOP BID {highestBidCents > 0 ? formatCentsToDollars(highestBidCents) : '$0'}
            </span>
          </div>

          <nav className="flex gap-2 font-medium text-xs">
            <a
              href="#rules"
              className="px-3 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-600 hover:text-gray-900"
            >
              How it works
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
