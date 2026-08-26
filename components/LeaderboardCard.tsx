'use client';

import React from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { ExternalLink, MousePointerClick, Tag, Clock, ArrowUpRight, Zap } from 'lucide-react';

interface LeaderboardCardProps {
  bid: Bid;
  rank: number;
  onTopUp?: (bid: Bid) => void;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export function LeaderboardCard({ bid, rank, onTopUp }: LeaderboardCardProps) {
  const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(bid.url);
  const favicon = bid.icon_url || getFaviconUrl(bid.url);
  const clickRedirect = `/api/click?id=${bid.id}&to=${encodeURIComponent(normalizedUrl)}`;
  const timeAgo = formatRelativeTime(bid.updated_at || bid.created_at);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-950/60 hover:bg-gray-900/70 border border-gray-850 hover:border-gray-700 transition-all gap-4 group">
      {/* Left: Rank + Icon + Details */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Rank Badge */}
        <div className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-xs text-gray-300 shrink-0">
          #{rank}
        </div>

        {/* Site Icon */}
        <div className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden mt-0.5 sm:mt-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={favicon}
            alt=""
            className="w-5 h-5 object-contain"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
        </div>

        {/* Title, Description & Metadata */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={clickRedirect}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold text-white hover:text-orange-400 transition-colors flex items-center gap-1.5 truncate"
            >
              <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-sm">
                {bid.title || displayDomain}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-orange-400 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
            </a>

            {/* Category Tag */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-400 text-[10px] font-semibold">
              <Tag className="w-2.5 h-2.5 text-orange-400/80" />
              {bid.category || 'Other'}
            </span>
          </div>

          {/* Description snippet */}
          {bid.description && (
            <p className="text-xs text-gray-400 line-clamp-1 leading-relaxed">
              {bid.description}
            </p>
          )}

          {/* Bottom Meta row: Domain + Relative Time + Clicks */}
          <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-0.5">
            <span className="truncate font-medium">{displayDomain}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              {timeAgo}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-gray-400 font-medium">
              <MousePointerClick className="w-3 h-3 text-gray-400" />
              {bid.click_count || 0} clicks
            </span>
          </div>
        </div>
      </div>

      {/* Right: Amount & Top-Up CTA */}
      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-900">
        <span className="text-sm font-black text-white px-3 py-1.5 rounded-xl bg-gray-900 border border-gray-800">
          {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'Free'}
        </span>

        {onTopUp && (
          <button
            onClick={() => onTopUp(bid)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-300 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-orange-400" />
            <span>Outbid</span>
          </button>
        )}
      </div>
    </div>
  );
}
