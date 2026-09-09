'use client';

import React, { useState, useEffect } from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { isWatchlisted, toggleWatchlist, getRankDelta, RankDeltaInfo } from '@/utils/watchlist';
import {
  MousePointerClick,
  ArrowUpRight,
  Zap,
  Star,
  CheckCircle2,
  Share2,
  Check,
} from 'lucide-react';

interface LeaderboardCardProps {
  bid: Bid;
  rank: number;
  onTopUp?: (bid: Bid) => void;
  onWatchlistChanged?: () => void;
}

function DeltaBadge({ deltaInfo }: { deltaInfo: RankDeltaInfo }) {
  if (deltaInfo.type === 'up') {
    return (
      <span className="inline-flex items-center px-1 rounded text-[8px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'down') {
    return (
      <span className="inline-flex items-center px-1 rounded text-[8px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'new') {
    return (
      <span className="inline-flex items-center px-1 rounded text-[8px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
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
  const isPaid = bid.status === 'paid';
  const favicon = bid.icon_url || getFaviconUrl(bid.url, 64);
  const timeFormatted = formatRelativeTime(bid.updated_at || bid.created_at);
  const deltaInfo = getRankDelta(bid.id, rank);

  const [bookmarked, setBookmarked] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const displayName = bid.title?.trim() || displayDomain;
    const shareUrl = `https://outbids.auction/bid/${bid.id}`;
    const shareTitle = `Rank #${rank} - ${displayName} on Outbids!`;
    const shareText = `I just secured the #${rank} spot on the live digital visibility board. Outbid me if you can.`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) {
      return;
    }
    window.open(`/go/${bid.id}`, '_blank', 'noopener,noreferrer');
  };

  const initialLetter = (bid.title || displayDomain).charAt(0).toUpperCase() || 'W';

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          const target = e.target as HTMLElement;
          if (!target.closest('button') && !target.closest('a')) {
            e.preventDefault();
            window.open(`/go/${bid.id}`, '_blank', 'noopener,noreferrer');
          }
        }
      }}
      tabIndex={0}
      role="link"
      aria-label={`Visit ${bid.title || displayDomain}`}
      className={`group w-full py-3 px-3 sm:px-4 border-b border-gray-200 transition-colors duration-100 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-2.5 md:gap-4 ${
        isRank1
          ? 'bg-amber-50/20 hover:bg-amber-50/40'
          : 'bg-white hover:bg-neutral-50/90'
      }`}
    >
      {/* Desktop Single Horizontal Plane: Left Side (Rank + Favicon + Title + Description + Tags) */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Rank Number */}
        <div className="flex items-center justify-center shrink-0 w-8 text-center">
          <span
            className={`font-mono text-xs sm:text-sm font-bold tabular-nums leading-none ${
              isRank1 ? 'text-neutral-950 font-black' : rank <= 3 ? 'text-neutral-800' : 'text-neutral-500'
            }`}
          >
            #{rank}
          </span>
          <div className="ml-1 scale-90">
            <DeltaBadge deltaInfo={deltaInfo} />
          </div>
        </div>

        {/* Favicon */}
        <div className="w-5 h-5 rounded-md bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 overflow-hidden">
          {!imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={favicon}
              alt=""
              className="w-3.5 h-3.5 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="font-mono font-bold text-[10px] text-neutral-600">
              {initialLetter}
            </span>
          )}
        </div>

        {/* Title, Verified Icon & Domain */}
        <div className="flex items-center gap-2 shrink-0 max-w-[170px] sm:max-w-[210px]">
          <a
            href={`/go/${bid.id}`}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-xs sm:text-sm text-neutral-900 hover:text-neutral-950 transition-colors inline-flex items-center gap-1 truncate"
            title={bid.url}
          >
            <span className="truncate">{bid.title || displayDomain}</span>
            <ArrowUpRight className="w-3 h-3 text-neutral-400 opacity-60 group-hover:opacity-100 transition-all shrink-0" />
          </a>

          {isPaid && (
            <span title="Verified Paid Listing" className="inline-flex shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-neutral-700" />
            </span>
          )}
        </div>

        {/* Description snippet on Desktop (Truncated inline) */}
        {bid.description && (
          <span
            className="text-xs text-neutral-500 truncate flex-1 min-w-0 max-w-xs xl:max-w-md hidden md:block"
            title={bid.description}
          >
            {bid.description}
          </span>
        )}

        {/* Category Tag */}
        <span className="text-[10px] font-mono text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200 shrink-0 hidden sm:inline-block">
          {bid.category || 'Other'}
        </span>

        {/* Timestamp & Unobtrusive Sponsored Badge */}
        <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-neutral-400 font-mono shrink-0">
          <span>{timeFormatted}</span>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[8px] uppercase font-bold tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200">
            Sponsored
          </span>
        </div>
      </div>

      {/* Desktop Single Horizontal Plane: Right Side (Clicks + Total Bid + Boost Button + Quick Actions) */}
      <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4 shrink-0 pt-1 md:pt-0">
        {/* Mobile-only subline (category + sponsored) */}
        <div className="flex sm:hidden items-center gap-1.5 text-[10px] text-neutral-500 font-mono">
          <span className="truncate max-w-[100px]">{bid.category || 'Other'}</span>
          <span>•</span>
          <span className="text-[8px] uppercase font-bold px-1 rounded bg-neutral-100 border border-neutral-200">
            Sponsored
          </span>
        </div>

        {/* Clicks Counter */}
        <div
          className="flex items-center gap-1 text-xs font-mono text-neutral-600 tabular-nums"
          title="24h Deduplicated Clicks"
        >
          <MousePointerClick className="w-3 h-3 text-neutral-400" />
          <span>{(bid.click_count || 0).toLocaleString()}</span>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">clicks</span>
        </div>

        {/* Total Bid Amount */}
        <div className="text-right min-w-[4rem] sm:min-w-[4.8rem]">
          <span
            className={`font-mono text-xs sm:text-sm font-bold tabular-nums ${
              bid.amount > 0 ? 'text-neutral-950 font-black' : 'text-neutral-500'
            }`}
          >
            {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'FREE'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`p-1 rounded border transition-colors cursor-pointer text-xs ${
              copiedShare
                ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                : 'border-transparent hover:border-neutral-300 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-800'
            }`}
            title="Share listing"
            aria-label="Share listing"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-neutral-800" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Watchlist Star */}
          <button
            onClick={handleToggleStar}
            className="p-1 rounded border border-transparent hover:border-neutral-300 hover:bg-neutral-100 text-neutral-400 hover:text-amber-500 transition-colors cursor-pointer"
            title={bookmarked ? 'Bookmark to Watchlist' : 'Remove from Watchlist'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                bookmarked ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'
              }`}
            />
          </button>

          {/* Outbid / Boost CTA */}
          {onTopUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTopUp(bid);
              }}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
              title="Add a boost payment to climb the ranks"
            >
              <Zap className="w-3 h-3 text-neutral-200" />
              <span>Boost</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
