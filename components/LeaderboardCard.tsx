'use client';

import React, { useState, useEffect } from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { isWatchlisted, toggleWatchlist, getRankDelta, RankDeltaInfo } from '@/utils/watchlist';
import { MousePointerClick, Tag, Clock, ArrowUpRight, Zap, Star, Crown, Medal } from 'lucide-react';

interface LeaderboardCardProps {
  bid: Bid;
  rank: number;
  onTopUp?: (bid: Bid) => void;
  onWatchlistChanged?: () => void;
}

function DeltaBadge({ deltaInfo }: { deltaInfo: RankDeltaInfo }) {
  if (deltaInfo.type === 'up') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'down') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'new') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
        NEW
      </span>
    );
  }
  return null;
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

export function LeaderboardCard({ bid, rank, onTopUp, onWatchlistChanged }: LeaderboardCardProps) {
  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
  const isPodium = rank <= 3;
  const isRank1 = rank === 1;
  const isRank2 = rank === 2;
  const isRank3 = rank === 3;

  const favicon = bid.icon_url || getFaviconUrl(bid.url, isPodium ? 128 : 64);
  const timeAgo = formatRelativeTime(bid.updated_at || bid.created_at);
  const deltaInfo = getRankDelta(bid.id, rank);

  const [bookmarked, setBookmarked] = useState(false);

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

  // -------------------------------------------------------------
  // PODIUM CARD DESIGN (Ranks #1, #2, #3 - min-height 109px, 56px Avatar)
  // -------------------------------------------------------------
  if (isPodium) {
    return (
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 sm:p-6 rounded-2xl min-h-[109px] transition-all gap-4 group relative overflow-hidden backdrop-blur-xl ${
          isRank1
            ? 'bg-gradient-to-r from-orange-950/40 via-orange-900/20 to-black/80 border-2 border-orange-500/70 shadow-2xl shadow-orange-500/15 hover:border-orange-400'
            : isRank2
            ? 'bg-gradient-to-r from-slate-900/60 to-black/80 border border-slate-700/60 shadow-lg hover:border-slate-500'
            : 'bg-gradient-to-r from-amber-950/30 to-black/80 border border-amber-900/50 shadow-lg hover:border-amber-700'
        }`}
      >
        {/* Top accent glow line for #1 */}
        {isRank1 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />
        )}

        {/* Left: Rank + 56px Avatar + Details */}
        <div className="flex items-start sm:items-center gap-4 min-w-0 flex-1">
          {/* Rank Badge + Delta */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md ${
                isRank1
                  ? 'bg-orange-500 text-black shadow-orange-500/30'
                  : isRank2
                  ? 'bg-slate-400/20 border border-slate-400/40 text-slate-200'
                  : 'bg-amber-800/20 border border-amber-700/40 text-amber-500'
              }`}
            >
              {isRank1 ? <Crown className="w-5 h-5" /> : isRank2 ? <Medal className="w-4 h-4" /> : <Medal className="w-4 h-4" />}
            </div>
            <DeltaBadge deltaInfo={deltaInfo} />
          </div>

          {/* 56px Avatar Icon */}
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden shadow-inner ${
              isRank1
                ? 'bg-black/60 border-2 border-orange-500/40'
                : isRank2
                ? 'bg-black/50 border border-slate-700'
                : 'bg-black/50 border border-amber-900/60'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={favicon}
              alt=""
              className="w-8 h-8 object-contain"
              onError={(e) => (e.currentTarget.style.display = 'none')}
            />
          </div>

          {/* Title, Description & Metadata */}
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/go/${bid.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-base sm:text-lg font-extrabold transition-colors flex items-center gap-1.5 truncate ${
                  isRank1
                    ? 'text-white hover:text-orange-300'
                    : 'text-white hover:text-orange-400'
                }`}
              >
                <span className="truncate max-w-[220px] sm:max-w-xs md:max-w-md">
                  {bid.title || displayDomain}
                </span>
                <ArrowUpRight className="w-4 h-4 text-orange-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </a>

              {/* Champion or Category Tag */}
              {isRank1 ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-black border border-orange-500/40">
                  <Crown className="w-2.5 h-2.5" />
                  CHAMPION
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300 text-[10px] font-bold">
                  <Tag className="w-2.5 h-2.5 text-orange-400" />
                  {bid.category || 'Other'}
                </span>
              )}
            </div>

            {/* Description snippet */}
            {bid.description && (
              <p
                className={`text-xs line-clamp-1 leading-relaxed ${
                  isRank1 ? 'text-orange-100/90' : 'text-gray-300/80'
                }`}
              >
                {bid.description}
              </p>
            )}

            {/* Bottom Meta row: Domain + Relative Time + Clicks */}
            <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-0.5">
              <span className="truncate font-semibold text-gray-300">{displayDomain}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock className="w-3 h-3" />
                {timeAgo}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-bold text-orange-400">
                <MousePointerClick className="w-3 h-3" />
                {bid.click_count || 0} clicks
              </span>
            </div>
          </div>
        </div>

        {/* Right: Watchlist Star + Amount & Top-Up CTA */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-900">
          <button
            onClick={handleToggleStar}
            className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
            title={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
            aria-label={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
          >
            <Star
              className={`w-4 h-4 ${
                bookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
              }`}
            />
          </button>

          <span
            className={`text-sm sm:text-base font-black px-3.5 py-1.5 rounded-xl border shadow-inner ${
              isRank1
                ? 'bg-orange-950/80 text-orange-300 border-orange-500/50'
                : 'bg-gray-900 text-white border-gray-800'
            }`}
          >
            {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'Free'}
          </span>

          {onTopUp && (
            <button
              onClick={() => onTopUp(bid)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-300 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-orange-400" />
              <span>Outbid</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD COMPACT CARD DESIGN (Ranks #4+)
  // -------------------------------------------------------------
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-950/60 hover:bg-gray-900/70 border border-gray-850 hover:border-gray-700 transition-all gap-4 group">
      {/* Left: Rank + Icon + Details */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Rank Badge + Delta */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-xs text-gray-300">
            #{rank}
          </div>
          <DeltaBadge deltaInfo={deltaInfo} />
        </div>

        {/* Site Icon (Standard 40px) */}
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
              href={`/go/${bid.id}`}
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

      {/* Right: Watchlist Star + Amount & Top-Up CTA */}
      <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-900">
        <button
          onClick={handleToggleStar}
          className="p-2 rounded-xl bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
          title={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
          aria-label={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
        >
          <Star
            className={`w-4 h-4 ${
              bookmarked ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
            }`}
          />
        </button>

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
