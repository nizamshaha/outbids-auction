'use client';

import React, { useEffect, useState } from 'react';
import { Bid } from '@/types/bid';
import { sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import confetti from 'canvas-confetti';
import {
  Trophy,
  CheckCircle2,
  Share2,
  Copy,
  Check,
  X,
  ExternalLink,
  Flame,
} from 'lucide-react';

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  rank: number;
  bid: Bid;
}

export function CelebrationModal({
  isOpen,
  onClose,
  rank,
  bid,
}: CelebrationModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 150,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FF4B4B', '#FF7A00', '#10B981', '#3B82F6', '#FBBF24'],
        });
      } catch {}
    }
  }, [isOpen]);

  if (!isOpen || !bid) return null;

  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
  const favicon = bid.icon_url || getFaviconUrl(bid.url, 64);
  const shareTargetUrl = `https://outbids.auction/go/${bid.id}`;

  // Twitter Intent URL matching user spec:
  // https://twitter.com/intent/tweet?text=I%20just%20claimed%20Rank%20%23${rank}%20on%20outbids.auction!%20Outbid%20me%20if%20you%20can:%20https://outbids.auction/go/${id}
  const tweetText = `I just claimed Rank #${rank} on outbids.auction! Outbid me if you can: https://outbids.auction/go/${bid.id}`;
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareTargetUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Gradient Accent */}
        <div className="h-2 w-full bg-gradient-to-r from-[#FF4B4B] via-[#FF7A00] to-[#E03E3E]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 text-center space-y-5">
          {/* Celebratory Icon & Badge */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-[#FFF5F3] border-2 border-[#FFE4E0] flex items-center justify-center shadow-inner">
                <Trophy className="w-8 h-8 text-[#FF4B4B]" />
              </div>
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF4B4B] opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-[#FF4B4B] text-[9px] font-black text-white items-center justify-center">
                  ★
                </span>
              </span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF4B4B] bg-[#FFF5F3] px-3 py-1 rounded-full border border-[#FFE4E0]">
              Listing Verified &amp; Broadcast Live
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-950 mt-3 tracking-tight">
              You Just Claimed Rank{' '}
              <span className="text-[#FF4B4B]">#{rank}</span>!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1.5 leading-relaxed max-w-sm mx-auto">
              Your link is now streaming live at the top of OutBids. Defend your spot before someone outbids you.
            </p>
          </div>

          {/* Listing Preview Card */}
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 flex items-center gap-3 text-left">
            <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={favicon}
                alt=""
                className="w-5 h-5 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {bid.title || displayDomain}
                </p>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              </div>
              <p className="text-xs text-gray-500 font-mono truncate">
                {displayDomain}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-block px-2.5 py-1 rounded-lg bg-[#FF4B4B] text-white font-mono font-bold text-xs shadow-2xs">
                #{rank} SPOT
              </span>
            </div>
          </div>

          {/* High-Contrast "Brag on X (Twitter)" Action Button */}
          <div className="space-y-2.5 pt-1">
            <a
              href={twitterIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-black hover:bg-neutral-800 text-white transition-all shadow-md flex items-center justify-center gap-2.5 group cursor-pointer active:scale-[0.99]"
            >
              {/* X (formerly Twitter) Icon */}
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-white shrink-0 group-hover:scale-110 transition-transform"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Brag on X (Twitter)</span>
            </a>

            {/* Secondary Actions: Copy Link & Dismiss */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy Unique Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-3 rounded-xl border border-transparent hover:bg-gray-100 text-gray-600 text-xs font-semibold transition-colors cursor-pointer"
              >
                View on Leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
