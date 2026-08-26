'use client';

import React, { useState, useEffect } from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { isWatchlisted, toggleWatchlist, getRankDelta, RankDeltaInfo } from '@/utils/watchlist';
import { MousePointerClick, ArrowUpRight, Zap, Star, Crown } from 'lucide-react';

interface LeaderboardCardProps {
  bid: Bid;
  rank: number;
  onTopUp?: (bid: Bid) => void;
  onWatchlistChanged?: () => void;
}

function DeltaBadge({ deltaInfo }: { deltaInfo: RankDeltaInfo }) {
  if (deltaInfo.type === 'up') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'down') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'new') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
        NEW
      </span>
    );
  }
  return null;
}

function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recent';
  }
}

export function LeaderboardCard({ bid, rank, onTopUp, onWatchlistChanged }: LeaderboardCardProps) {
  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
  const isRank1 = rank === 1;
  const favicon = bid.icon_url || getFaviconUrl(bid.url, 128);
  const timeFormatted = formatRelativeTime(bid.updated_at || bid.created_at);
  const deltaInfo = getRankDelta(bid.id, rank);

  const [bookmarked, setBookmarked] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setBookmarked(isWatchlisted(bid.id));
  }, [bid.id]);

  const handleToggleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newState = toggleWatchlist(bid.id);
    setBookmarked(newState);
    onWatchlistChanged?.();
  };

  const initialLetter = (bid.title || displayDomain).charAt(0).toUpperCase() || 'W';

  return (
    <div
      className={`bg-surface rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 relative overflow-hidden transition-all shadow-sm ${
        isRank1
          ? 'border-2 border-primary/30 shadow-md'
          : 'border border-outline-variant hover:border-primary/40'
      }`}
    >
      {/* Subtle warm gradient wash for #1 Champion */}
      {isRank1 && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary-fixed/40 via-primary-fixed/10 to-transparent pointer-events-none" />
      )}

      {/* Rank Number & Delta */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-1 z-10 shrink-0">
        <div
          className={`rank-number pt-0.5 ${
            isRank1 ? 'text-primary font-bold' : rank <= 3 ? 'text-primary' : 'text-outline'
          }`}
        >
          #{rank}
        </div>
        <DeltaBadge deltaInfo={deltaInfo} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 z-10 space-y-2.5 min-w-0">
        {/* Header Row: Icon + Title + Price */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Favicon or Fallback Monogram Avatar */}
            <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center shrink-0 border border-outline-variant overflow-hidden">
              {!imgError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={favicon}
                  alt=""
                  className="w-6 h-6 object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-display font-bold text-lg text-primary">{initialLetter}</span>
              )}
            </div>

            {/* Title & Domain */}
            <div className="min-w-0 flex-1">
              <a
                href={`/go/${bid.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-xl sm:text-2xl font-display text-on-surface hover:text-primary transition-colors flex items-center gap-1.5 group"
              >
                <span className="truncate">{bid.title || displayDomain}</span>
                <ArrowUpRight className="w-4 h-4 text-text-muted opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all shrink-0" />
              </a>
              <p className="text-xs text-text-muted truncate font-medium">{displayDomain}</p>
            </div>
          </div>

          {/* Price & Star Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleToggleStar}
              className="p-1.5 rounded-lg hover:bg-surface-container text-text-muted hover:text-amber-600 transition-colors cursor-pointer"
              title={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
            >
              <Star
                className={`w-4 h-4 ${bookmarked ? 'fill-amber-500 text-amber-500' : 'text-outline'}`}
              />
            </button>

            <span
              className={`font-semibold text-lg sm:text-xl ${
                bid.amount > 0 ? 'text-primary' : 'text-outline'
              }`}
            >
              {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'FREE'}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        {bid.description && (
          <p className="text-sm sm:text-base text-text-muted leading-relaxed line-clamp-2">
            {bid.description}
          </p>
        )}

        {/* Bottom Meta Row: Category Badge + Date + Clicks + Outbid Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-text-muted border-t border-outline-variant/60">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="badge">{bid.category || 'Other'}</span>
            <span>{timeFormatted}</span>
            <span className="font-semibold text-text-main flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5 text-primary" />
              {bid.click_count || 0} clicks
            </span>
          </div>

          {onTopUp && (
            <button
              onClick={() => onTopUp(bid)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-container transition-colors flex items-center gap-1 cursor-pointer shadow-sm ml-auto"
            >
              <Zap className="w-3 h-3 text-white" />
              <span>Outbid</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
