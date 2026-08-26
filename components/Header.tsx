'use client';

import React from 'react';
import { Flame, Trophy, TrendingUp, DollarSign } from 'lucide-react';
import { LiveBadge } from './LiveBadge';
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
    <header className="w-full pt-12 pb-8 px-4 flex flex-col items-center text-center">
      {/* Real-time connection badge */}
      <div className="mb-4">
        <LiveBadge isConnected={isConnected} />
      </div>

      {/* Main title */}
      <h1 className="text-4xl sm:text-6xl font-black tracking-tight bg-gradient-to-r from-white via-gray-200 to-indigo-400 bg-clip-text text-transparent mb-3">
        OUTBID<span className="text-indigo-500">.LIVE</span>
      </h1>

      {/* Subtitle */}
      <p className="max-w-2xl text-base sm:text-lg text-gray-400 mb-6 font-normal">
        The ultimate real-time billboard. Outbid the competition to claim the top spot, gain instant visibility, and dominate the leaderboard.
      </p>

      {/* How it works 3-step pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl w-full mb-8 text-left">
        <div className="glass-card p-3.5 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 shrink-0 font-bold text-sm">
            01
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Submit URL</h4>
            <p className="text-xs text-gray-400 mt-0.5">Enter your link and set your bid amount ($1+)</p>
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0 font-bold text-sm">
            02
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Instant Checkout</h4>
            <p className="text-xs text-gray-400 mt-0.5">Secure global payment verified in seconds with Dodo Payments</p>
          </div>
        </div>

        <div className="glass-card p-3.5 rounded-xl flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0 font-bold text-sm">
            03
          </div>
          <div>
            <h4 className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Live Broadcast</h4>
            <p className="text-xs text-gray-400 mt-0.5">Stream live directly to the leaderboard via Supabase</p>
          </div>
        </div>
      </div>

      {/* Quick dynamic stats row */}
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 py-3 px-6 rounded-2xl glass-panel text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <span className="text-gray-400 text-xs sm:text-sm">Top Bid:</span>
          <span className="font-bold text-amber-400">
            {highestBidCents > 0 ? formatCentsToDollars(highestBidCents) : '$0'}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-800 hidden sm:block" />

        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-400" />
          <span className="text-gray-400 text-xs sm:text-sm">Total Paid Bids:</span>
          <span className="font-bold text-white">{totalBids}</span>
        </div>
      </div>
    </header>
  );
}
