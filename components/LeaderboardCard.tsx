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
  Trophy,
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
  const isPaid = bid.status === 'paid';
  const favicon = bid.icon_url || getFaviconUrl(bid.url, 128);
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

    const shareText = `I just claimed my spot on the outbids.auction leaderboard. Outbid me if you can: https://outbids.auction`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Outbids.auction — Live Leaderboard',
          text: shareText,
          url: 'https://outbids.auction',
        });
        return;
      } catch (err) {
        // Fallback to clipboard if share dialog dismissed or unsupported
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2200);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
  };

  const initialLetter = (bid.title || displayDomain).charAt(0).toUpperCase() || 'W';

  return (
    <div
      className={`rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 relative overflow-hidden transition-all shadow-sm ${
        isRank1
          ? 'bg-[#faf5ee] border-2 border-[#c2652a] ring-1 ring-[#c2652a]/20 shadow-lg shadow-[#c2652a]/10'
          : 'bg-[#faf5ee] border border-[#d8d0c8] hover:border-[#c2652a]/50'
      }`}
    >
      {/* Subtle warm terracotta highlight background for #1 Achievement */}
      {isRank1 && (
        <div className="absolute inset-0 bg-gradient-to-r from-[#c2652a]/10 via-[#faf5ee]/40 to-transparent pointer-events-none" />
      )}

      {/* Rank Number & Achievement Crown */}
      <div className="flex sm:flex-col items-center justify-between sm:justify-start gap-1.5 z-10 shrink-0 min-w-[3.5rem]">
        {isRank1 ? (
          <div className="flex items-center sm:flex-col gap-1 text-[#c2652a]">
            <div className="w-8 h-8 rounded-xl bg-[#c2652a]/15 border border-[#c2652a]/30 flex items-center justify-center shadow-xs">
              <Trophy className="w-4 h-4 text-[#c2652a]" />
            </div>
            <span className="font-display font-black text-xl sm:text-2xl text-[#c2652a] tracking-tight">
              #1
            </span>
          </div>
        ) : (
          <div
            className={`font-display text-xl sm:text-2xl font-bold pt-0.5 ${
              rank <= 3 ? 'text-[#c2652a]' : 'text-[#605850]'
            }`}
          >
            #{rank}
          </div>
        )}
        <DeltaBadge deltaInfo={deltaInfo} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 z-10 space-y-2.5 min-w-0">
        {/* Header Row: Favicon + Title + Verified Badge + Price + Actions */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Favicon or Fallback Monogram Avatar */}
            <div className="w-10 h-10 rounded-xl bg-[#f2ece4] flex items-center justify-center shrink-0 border border-[#d8d0c8] overflow-hidden shadow-xs">
              {!imgError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={favicon}
                  alt=""
                  className="w-6 h-6 object-contain"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span className="font-display font-bold text-lg text-[#c2652a]">
                  {initialLetter}
                </span>
              )}
            </div>

            {/* Title & Domain & Verified Badge */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={`/go/${bid.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-xl sm:text-2xl font-display text-[#1a1a1a] hover:text-[#c2652a] transition-colors flex items-center gap-1.5 group truncate"
                >
                  <span className="truncate">{bid.title || displayDomain}</span>
                  <ArrowUpRight className="w-4 h-4 text-[#605850] opacity-60 group-hover:opacity-100 group-hover:text-[#c2652a] transition-all shrink-0" />
                </a>

                {/* Verified Listing Badge */}
                {isPaid && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#c2652a]/10 text-[#c2652a] border border-[#c2652a]/30 shrink-0"
                    title="Verified Active Placement"
                  >
                    <CheckCircle2 className="w-3 h-3 text-[#c2652a]" />
                    <span>Verified</span>
                  </span>
                )}

                {/* Champion Pill on #1 */}
                {isRank1 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c2652a] text-white shadow-xs shrink-0">
                    Leader
                  </span>
                )}
              </div>

              <p className="text-xs text-[#605850] truncate font-medium mt-0.5">
                {displayDomain}
              </p>
            </div>
          </div>

          {/* Price & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Share Button */}
            <button
              onClick={handleShare}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold ${
                copiedShare
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'border-[#d8d0c8] bg-[#faf5ee] hover:bg-[#f2ece4] text-[#605850] hover:text-[#1a1a1a]'
              }`}
              title="Share listing on social media"
              aria-label="Share listing"
            >
              {copiedShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline text-[10px]">Copied!</span>
                </>
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Watchlist Star */}
            <button
              onClick={handleToggleStar}
              className="p-1.5 rounded-lg border border-[#d8d0c8] bg-[#faf5ee] hover:bg-[#f2ece4] text-[#605850] hover:text-amber-600 transition-colors cursor-pointer"
              title={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
            >
              <Star
                className={`w-3.5 h-3.5 ${
                  bookmarked ? 'fill-amber-500 text-amber-500' : 'text-[#605850]'
                }`}
              />
            </button>

            {/* Bid Amount */}
            <span
              className={`font-semibold text-lg sm:text-xl pl-1 ${
                bid.amount > 0 ? 'text-[#c2652a] font-display' : 'text-[#605850]'
              }`}
            >
              {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'FREE'}
            </span>
          </div>
        </div>

        {/* Description snippet */}
        {bid.description && (
          <p className="text-sm sm:text-base text-[#605850] leading-relaxed line-clamp-2">
            {bid.description}
          </p>
        )}

        {/* Bottom Meta Row: Category Badge + Date + Clicks + Outbid Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#605850] border-t border-[#d8d0c8]/60">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-[#f2ece4] text-[#3a302a] font-semibold border border-[#d8d0c8]">
              {bid.category || 'Other'}
            </span>
            <span>{timeFormatted}</span>
            <span className="font-semibold text-[#1a1a1a] flex items-center gap-1">
              <MousePointerClick className="w-3.5 h-3.5 text-[#c2652a]" />
              {bid.click_count || 0} clicks
            </span>
          </div>

          {onTopUp && (
            <button
              onClick={() => onTopUp(bid)}
              className="px-3.5 py-1 rounded-xl text-xs font-bold bg-[#c2652a] text-white hover:bg-[#c2652a]/90 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs ml-auto"
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
