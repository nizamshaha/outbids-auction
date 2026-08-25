'use client';

import React from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { Crown, Medal, ExternalLink, Globe } from 'lucide-react';

interface LeaderboardItemProps {
  bid: Bid;
  rank: number;
}

export function LeaderboardItem({ bid, rank }: LeaderboardItemProps) {
  const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(bid.url);
  const favicon = getFaviconUrl(bid.url);

  // Styling based on rank
  let rankBadge = null;
  let cardBorderClass = 'glass-card';

  if (rank === 1) {
    cardBorderClass = 'glass-panel glow-gold border-amber-500/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent';
    rankBadge = (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-400 font-extrabold text-base shadow-sm">
        <Crown className="w-5 h-5 text-amber-400 animate-pulse" />
      </div>
    );
  } else if (rank === 2) {
    cardBorderClass = 'glass-panel glow-silver border-slate-400/40 bg-gradient-to-r from-slate-400/10 via-slate-400/5 to-transparent';
    rankBadge = (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-400/20 border border-slate-400/40 text-slate-200 font-extrabold text-base">
        <Medal className="w-5 h-5 text-slate-300" />
      </div>
    );
  } else if (rank === 3) {
    cardBorderClass = 'glass-panel glow-bronze border-amber-700/40 bg-gradient-to-r from-amber-700/10 via-amber-700/5 to-transparent';
    rankBadge = (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-700/20 border border-amber-700/40 text-amber-600 font-extrabold text-base">
        <Medal className="w-5 h-5 text-amber-600" />
      </div>
    );
  } else {
    rankBadge = (
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700/60 text-gray-400 font-bold text-sm">
        #{rank}
      </div>
    );
  }

  // Format creation date
  const formattedDate = new Date(bid.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className={`group relative flex items-center justify-between p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] ${cardBorderClass}`}
    >
      {/* Left side: Rank + Domain + Favicon */}
      <div className="flex items-center gap-3.5 min-w-0">
        {rankBadge}

        <div className="flex items-center gap-3 min-w-0">
          {/* Favicon */}
          <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-800/90 border border-gray-700/50 flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={favicon}
              alt=""
              className="w-5 h-5 object-contain"
              onError={(e) => {
                // Fallback to globe icon on error
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent) {
                  parent.innerHTML = '<span class="text-gray-400 text-xs">🌐</span>';
                }
              }}
            />
          </div>

          {/* Link / URL */}
          <div className="min-w-0">
            <a
              href={normalizedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-gray-100 hover:text-indigo-400 text-base sm:text-lg transition-colors group-hover:underline underline-offset-4 truncate max-w-[200px] sm:max-w-md"
              title={normalizedUrl}
            >
              <span className="truncate">{displayDomain}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
            </a>
            <p className="text-[11px] text-gray-400">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Right side: Amount */}
      <div className="flex flex-col items-end shrink-0 pl-3">
        <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-extrabold text-base sm:text-lg tracking-tight">
          {formatCentsToDollars(bid.amount)}
        </div>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">USD</span>
      </div>
    </div>
  );
}
