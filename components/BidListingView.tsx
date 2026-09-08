'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ExternalLink,
  Share2,
  Check,
  CheckCircle2,
  Trophy,
  ArrowUpRight,
  Sparkles,
  Zap,
  Tag,
  Star,
  Flame,
  MousePointerClick,
  Clock,
} from 'lucide-react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { isWatchlisted, toggleWatchlist } from '@/utils/watchlist';

interface BidListingViewProps {
  bid: Bid;
  rank: number;
}

export function BidListingView({ bid, rank }: BidListingViewProps) {
  const [copiedShare, setCopiedShare] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [imgError, setImgError] = useState(false);

  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
  const displayName = bid.title?.trim() || displayDomain || 'Featured Listing';
  const isRank1 = rank === 1;
  const isTop3 = rank <= 3 && rank > 0;
  const isPaid = bid.status === 'paid';
  const favicon = bid.icon_url || getFaviconUrl(bid.url, 128);
  const nextOutbidDollars = Math.max(1, Math.ceil(bid.amount / 100) + 1);

  useEffect(() => {
    setBookmarked(isWatchlisted(bid.id));
  }, [bid.id]);

  const handleToggleStar = (e: React.MouseEvent) => {
    e.preventDefault();
    const newState = toggleWatchlist(bid.id);
    setBookmarked(newState);
  };

  const handleShare = async () => {
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
      } catch (err) {
        // Fallback to clipboard if share dialog dismissed or unsupported
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2200);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Spotlight Card */}
      <div
        className={`rounded-3xl p-6 sm:p-10 relative overflow-hidden transition-all shadow-md ${
          isRank1
            ? 'bg-[#faf5ee] border-2 border-[#c2652a] ring-2 ring-[#c2652a]/20 shadow-xl shadow-[#c2652a]/10'
            : isTop3
            ? 'bg-[#faf5ee] border-2 border-[#c2652a]/50 shadow-lg'
            : 'bg-[#faf5ee] border border-[#d8d0c8]'
        }`}
      >
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-[#c2652a]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
          {/* Main Info */}
          <div className="flex items-start gap-4 sm:gap-6 flex-1 min-w-0">
            {/* Favicon / Avatar */}
            <div className="relative shrink-0">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center p-2.5 overflow-hidden transition-transform shadow-xs ${
                  isRank1
                    ? 'bg-[#faf5ee] border-2 border-[#c2652a]'
                    : 'bg-[#f2ece4] border border-[#d8d0c8]'
                }`}
              >
                {!imgError && favicon ? (
                  <img
                    src={favicon}
                    alt={displayName}
                    className="w-full h-full object-contain"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold font-display text-[#c2652a]">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Verified badge icon overlay */}
              {isPaid && (
                <div
                  className="absolute -bottom-1 -right-1 bg-[#faf5ee] rounded-full p-0.5 shadow-xs"
                  title="Verified Placement"
                >
                  <CheckCircle2 className="w-5 h-5 text-[#c2652a]" />
                </div>
              )}
            </div>

            {/* Titles & Metadata */}
            <div className="space-y-2 flex-1 min-w-0">
              {/* Badges Row */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Rank Badge */}
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase shadow-xs ${
                    isRank1
                      ? 'bg-[#c2652a] text-white'
                      : isTop3
                      ? 'bg-[#fbe8d8] text-[#c2652a] border border-[#c2652a]/30'
                      : 'bg-[#f2ece4] text-[#3a302a] border border-[#d8d0c8]'
                  }`}
                >
                  {isRank1 ? <Trophy className="w-3.5 h-3.5" /> : null}
                  <span>Rank #{rank > 0 ? rank : 'Unranked'}</span>
                </span>

                {/* Category Badge */}
                {bid.category && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#f2ece4] text-[#605850] border border-[#d8d0c8]">
                    <Tag className="w-3 h-3 text-[#c2652a]" />
                    <span>{bid.category}</span>
                  </span>
                )}

                {/* Live Badge */}
                {isPaid && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Billboard</span>
                  </span>
                )}
              </div>

              {/* Title & Domain */}
              <div>
                <a
                  href={`/go/${bid.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a] hover:text-[#c2652a] transition-colors"
                >
                  <span className="break-words">{displayName}</span>
                  <ArrowUpRight className="w-5 h-5 text-[#605850] opacity-60 group-hover:opacity-100 group-hover:text-[#c2652a] transition-all shrink-0" />
                </a>
                <p className="text-sm font-medium text-[#605850] mt-0.5">{displayDomain}</p>
              </div>

              {/* Description */}
              {bid.description && (
                <p className="text-sm sm:text-base text-[#3a302a] leading-relaxed pt-1 max-w-2xl font-normal">
                  {bid.description}
                </p>
              )}

              {/* Clicks & Stats if available */}
              <div className="flex items-center gap-4 text-xs font-semibold text-[#605850] pt-2">
                {typeof bid.click_count === 'number' && (
                  <span className="inline-flex items-center gap-1">
                    <MousePointerClick className="w-3.5 h-3.5 text-[#c2652a]" />
                    <span>{bid.click_count.toLocaleString()} Clicks Recorded</span>
                  </span>
                )}
                {bid.created_at && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#605850]" />
                    <span>Active since {new Date(bid.created_at).toLocaleDateString()}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Price & Action Box */}
          <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-4 pt-4 md:pt-0 border-t md:border-t-0 border-[#d8d0c8]">
            <div className="text-left md:text-right">
              <span className="text-xs uppercase font-bold tracking-wider text-[#605850] block">
                Current Bid Locked
              </span>
              <span className="text-3xl sm:text-4xl font-black font-display text-[#c2652a]">
                {formatCentsToDollars(bid.amount)}
              </span>
            </div>

            {/* Social Share & Watchlist Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                  copiedShare
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-[#d8d0c8] bg-[#faf5ee] hover:bg-[#f2ece4] text-[#3a302a]'
                }`}
                title="Share this listing"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-[#c2652a]" />
                    <span>Share Spot</span>
                  </>
                )}
              </button>

              <button
                onClick={handleToggleStar}
                className="p-2 rounded-xl border border-[#d8d0c8] bg-[#faf5ee] hover:bg-[#f2ece4] text-[#605850] hover:text-amber-600 transition-colors cursor-pointer"
                title={bookmarked ? 'Remove from Watchlist' : 'Bookmark to Watchlist'}
              >
                <Star
                  className={`w-4 h-4 ${
                    bookmarked ? 'fill-amber-500 text-amber-500' : 'text-[#605850]'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Action CTAs */}
        <div className="mt-8 pt-6 border-t border-[#d8d0c8] flex flex-col sm:flex-row items-center justify-between gap-4">
          <a
            href={`/go/${bid.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#f2ece4] hover:bg-[#ece6dc] border border-[#d8d0c8] text-[#1a1a1a] font-bold text-sm transition-colors shadow-xs"
          >
            <span>Visit {displayDomain}</span>
            <ExternalLink className="w-4 h-4 text-[#605850]" />
          </a>

          <div className="w-full sm:w-auto flex items-center gap-3">
            <Link
              href={`/?amount=${nextOutbidDollars}`}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#c2652a] hover:bg-[#c2652a]/90 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <Flame className="w-4 h-4" />
              <span>Outbid with ${nextOutbidDollars}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Leaderboard CTA & Exploration Card */}
      <div className="bg-[#f2ece4] rounded-2xl p-6 border border-[#d8d0c8] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <h4 className="font-bold font-display text-lg text-[#1a1a1a]">
            Want to see where everyone else ranks?
          </h4>
          <p className="text-xs sm:text-sm text-[#605850]">
            The attention market updates 24/7 with real-time websocket broadcasts.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#faf5ee] hover:bg-[#fff] border border-[#d8d0c8] text-[#1a1a1a] font-bold text-xs transition-colors shrink-0 shadow-xs"
        >
          <Zap className="w-4 h-4 text-[#c2652a]" />
          <span>View Live Leaderboard</span>
        </Link>
      </div>
    </div>
  );
}
