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
      <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold bg-neutral-100 text-neutral-800 border border-neutral-300">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'down') {
    return (
      <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-300">
        {deltaInfo.label}
      </span>
    );
  }
  if (deltaInfo.type === 'new') {
    return (
      <span className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold bg-neutral-100 text-neutral-900 border border-neutral-300">
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
      className={`group w-full py-3.5 px-4 sm:px-5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
        isRank1
          ? 'bg-white hover:bg-[#faf7f2] border-neutral-900/80 shadow-xs'
          : 'bg-white hover:bg-[#faf7f2] border-[#e2dad2] hover:border-neutral-400'
      }`}
    >
      {/* Left Section: Rank + Favicon + Identity & Core Metadata */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
        {/* Rank Indicator */}
        <div className="flex flex-col items-center justify-center shrink-0 w-8 sm:w-10 text-center">
          <span
            className={`font-mono text-sm sm:text-base font-bold tabular-nums leading-none ${
              isRank1 ? 'text-neutral-950 font-black' : rank <= 3 ? 'text-neutral-800' : 'text-neutral-500'
            }`}
          >
            #{rank}
          </span>
          <div className="mt-1 scale-90 sm:scale-100">
            <DeltaBadge deltaInfo={deltaInfo} />
          </div>
        </div>

        {/* Favicon */}
        <div className="w-8 h-8 rounded-lg bg-[#f6f2ec] border border-[#d8d0c8] flex items-center justify-center shrink-0 overflow-hidden">
          {!imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={favicon}
              alt=""
              className="w-4 h-4 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="font-mono font-bold text-xs text-neutral-700">
              {initialLetter}
            </span>
          )}
        </div>

        {/* Title, Domain, Category & Sponsored Badging */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`/go/${bid.id}`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-sm sm:text-base text-neutral-900 group-hover:text-neutral-950 transition-colors inline-flex items-center gap-1 truncate max-w-full"
              title={bid.url}
            >
              <span className="truncate">{bid.title || displayDomain}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 opacity-60 group-hover:opacity-100 group-hover:text-neutral-800 transition-all shrink-0" />
            </a>

            {isPaid && (
              <span
                className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-neutral-100 text-neutral-700 border border-neutral-200 shrink-0"
                title="Verified Paid Listing"
              >
                <CheckCircle2 className="w-2.5 h-2.5 text-neutral-600" />
                <span>Verified</span>
              </span>
            )}
          </div>

          {/* Subline: Domain + Category + Timestamp + Unobtrusive Sponsored Badge */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 font-mono mt-0.5 flex-wrap">
            <span className="text-neutral-600 truncate max-w-[140px] sm:max-w-none">{displayDomain}</span>
            <span>•</span>
            <span className="text-neutral-500">{bid.category || 'Other'}</span>
            <span>•</span>
            <span>{timeFormatted}</span>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] uppercase font-bold tracking-wider text-neutral-600 bg-neutral-100 border border-neutral-200">
              Sponsored
            </span>
          </div>
        </div>
      </div>

      {/* Right Section: Core Metrics (Clicks + Amount) + Row Actions */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0ebe3]">
        {/* Click Count Metric */}
        <div className="flex items-center gap-1 text-xs font-mono text-neutral-600 tabular-nums" title="24h Deduplicated Clicks">
          <MousePointerClick className="w-3.5 h-3.5 text-neutral-400" />
          <span>{(bid.click_count || 0).toLocaleString()}</span>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">clicks</span>
        </div>

        {/* Verified Bid Amount Metric */}
        <div className="text-right min-w-[4rem] sm:min-w-[5rem]">
          <span
            className={`font-mono text-sm sm:text-base font-bold tabular-nums ${
              bid.amount > 0 ? 'text-neutral-950 font-black' : 'text-neutral-500'
            }`}
          >
            {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'FREE'}
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center text-xs ${
              copiedShare
                ? 'bg-neutral-100 border-neutral-300 text-neutral-900'
                : 'border-transparent hover:border-neutral-300 hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800'
            }`}
            title="Share listing link"
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
            className="p-1.5 rounded-lg border border-transparent hover:border-neutral-300 hover:bg-neutral-100 text-neutral-400 hover:text-amber-500 transition-colors cursor-pointer"
            title={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                bookmarked ? 'fill-amber-500 text-amber-500' : 'text-neutral-400'
              }`}
            />
          </button>

          {/* Outbid CTA */}
          {onTopUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTopUp(bid);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white transition-colors flex items-center gap-1 cursor-pointer shadow-2xs shrink-0"
              title="Place a higher bid to overtake this rank"
            >
              <Zap className="w-3 h-3 text-neutral-200" />
              <span className="hidden xs:inline">Outbid</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
