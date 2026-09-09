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
      className={`group w-full py-3 sm:py-3.5 px-3 sm:px-4 transition-colors duration-150 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 ${
        rank <= 3
          ? 'bg-[#FFF5F3] hover:bg-[#FFEAE6] border-b border-[#FFE4E0]/80'
          : 'bg-white hover:bg-gray-50/80 border-b border-gray-100'
      }`}
    >
      {/* Left: Rank + 36x36 Favicon + Vertical Stack (Title, Description, Meta) */}
      <div className="flex items-start sm:items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
        {/* Rank Number */}
        <div className="w-7 sm:w-8 text-center shrink-0 flex flex-col items-center justify-center pt-1 sm:pt-0">
          <span className="font-mono text-sm sm:text-base font-bold text-gray-400 tabular-nums leading-none">
            {rank}
          </span>
          <div className="scale-75 mt-1">
            <DeltaBadge deltaInfo={deltaInfo} />
          </div>
        </div>

        {/* 36x36px Square Favicon */}
        <div className="w-9 h-9 rounded-lg border border-gray-200/80 bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
          {!imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={favicon}
              alt=""
              className="w-5 h-5 object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="font-mono font-bold text-xs text-gray-500">
              {initialLetter}
            </span>
          )}
        </div>

        {/* Vertical Stack */}
        <div className="flex flex-col min-w-0 flex-1">
          {/* Top Line: Bold Title + Verified Badge */}
          <div className="flex items-center gap-1.5 min-w-0">
            <a
              href={`/go/${bid.id}`}
              target="_blank"
              rel="sponsored noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-[#FF4B4B] transition-colors truncate flex items-center gap-1"
              title={bid.url}
            >
              <span className="truncate">{bid.title || displayDomain}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-gray-400 opacity-60 group-hover:opacity-100 transition-all shrink-0" />
            </a>

            {isPaid && (
              <span title="Verified Paid Listing" className="inline-flex shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
              </span>
            )}
          </div>

          {/* 1-Line Truncated Description */}
          {bid.description && (
            <p className="text-xs text-gray-500 truncate mt-0.5 max-w-xl" title={bid.description}>
              {bid.description}
            </p>
          )}

          {/* Bottom-Left Meta: Category Pill, Domain Name, Click Count */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 flex-wrap">
            <span className="text-[10px] font-medium text-gray-600 bg-gray-100/90 px-2 py-0.5 rounded-full border border-gray-200 shrink-0">
              {bid.category || 'Other'}
            </span>
            <span className="text-gray-400 font-mono truncate max-w-[150px] sm:max-w-none">
              {displayDomain}
            </span>
            <span className="text-gray-300">•</span>
            <span
              className="font-mono flex items-center gap-1 tabular-nums text-gray-500"
              title="24h Deduplicated Clicks"
            >
              <MousePointerClick className="w-3 h-3 text-gray-400" />
              <span>{(bid.click_count || 0).toLocaleString()} clicks</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Total Bid Amount & Action Buttons */}
      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0 pt-2 sm:pt-0 sm:self-center pl-10 sm:pl-0 border-t sm:border-t-0 border-gray-100/70">
        {/* Total Bid in Bold Coral/Orange */}
        <div className="text-right min-w-[4.5rem] sm:min-w-[5.2rem]">
          <span className="font-mono text-base sm:text-lg font-bold text-[#FF4B4B] tabular-nums">
            {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'FREE'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {onTopUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTopUp(bid);
              }}
              className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#FF4B4B] hover:bg-[#E03E3E] text-white transition-colors flex items-center gap-1 cursor-pointer shadow-xs shrink-0"
              title="Add payment to raise rank"
            >
              <Zap className="w-3 h-3 text-amber-200" />
              <span>Boost</span>
            </button>
          )}

          <button
            onClick={handleShare}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-xs ${
              copiedShare
                ? 'bg-gray-100 border-gray-300 text-gray-900'
                : 'border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-gray-700'
            }`}
            title="Share listing"
            aria-label="Share listing"
          >
            {copiedShare ? (
              <Check className="w-3.5 h-3.5 text-gray-900" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleToggleStar}
            className="p-1.5 rounded-lg border border-transparent hover:border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
            title={bookmarked ? 'Bookmark to Watchlist' : 'Remove from Watchlist'}
          >
            <Star
              className={`w-3.5 h-3.5 ${
                bookmarked ? 'fill-amber-500 text-amber-500' : 'text-gray-400'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
