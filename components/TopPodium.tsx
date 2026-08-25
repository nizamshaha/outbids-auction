'use client';

import React from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { Crown, Medal, ExternalLink, Globe, Sparkles, ArrowUpRight } from 'lucide-react';

interface TopPodiumProps {
  topBids: Bid[];
  onSelectBidAmount?: (amountDollars: number) => void;
}

export function TopPodium({ topBids, onSelectBidAmount }: TopPodiumProps) {
  const first = topBids[0] || null;
  const second = topBids[1] || null;
  const third = topBids[2] || null;

  return (
    <div className="w-full my-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-400" />
          <h2 className="text-sm font-extrabold uppercase tracking-widest text-gray-300">
            Top 3 Podium
          </h2>
        </div>
        <span className="text-[11px] text-gray-400 font-medium">Live High-Rank Placements</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* #2 Rank Card */}
        <div className="order-2 md:order-1 flex flex-col justify-between p-5 rounded-2xl bg-gray-900/60 border border-slate-700/50 backdrop-blur-xl relative overflow-hidden transition-all hover:border-slate-500/60 hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-slate-400/20 border border-slate-400/40 text-slate-200 flex items-center justify-center font-black text-sm">
                <Medal className="w-4 h-4 text-slate-300" />
              </div>
              <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">Rank #2</span>
            </div>
            {second && (
              <span className="text-sm font-black text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                {formatCentsToDollars(second.amount)}
              </span>
            )}
          </div>

          {second ? (
            (() => {
              const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(second.url);
              const favicon = getFaviconUrl(second.url);
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black/40 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={favicon}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <div className="min-w-0">
                      <a
                        href={normalizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-slate-300 transition-colors flex items-center gap-1.5 truncate group"
                      >
                        <span className="truncate">{displayDomain}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                      </a>
                      <p className="text-[10px] text-gray-400">Verified placement</p>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-6 text-center text-gray-400 text-xs">
              <p className="font-semibold text-gray-400">Spot Available</p>
              <button
                onClick={() => onSelectBidAmount && onSelectBidAmount(5)}
                className="mt-2 text-[11px] text-slate-400 hover:text-white underline"
              >
                Claim #2 for $5
              </button>
            </div>
          )}
        </div>

        {/* #1 Rank Card (Center Highlight - Coral / Orange Glow) */}
        <div className="order-1 md:order-2 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-orange-500/20 via-orange-950/30 to-black/80 border-2 border-orange-500/70 shadow-2xl shadow-orange-500/20 backdrop-blur-2xl relative overflow-hidden transition-all hover:scale-[1.02]">
          {/* Top accent glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-orange-500/25 border border-orange-400/60 text-orange-400 flex items-center justify-center font-black shadow-lg shadow-orange-500/30 animate-pulse">
                <Crown className="w-5 h-5 text-orange-300" />
              </div>
              <div>
                <span className="text-xs font-black text-orange-400 tracking-wider uppercase block">
                  Champion #1
                </span>
                <span className="text-[10px] text-orange-300/80 font-medium">Current Leader</span>
              </div>
            </div>
            {first && (
              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-orange-300 px-3 py-1 rounded-xl bg-orange-950/80 border border-orange-500/50 shadow-inner">
                  {formatCentsToDollars(first.amount)}
                </span>
              </div>
            )}
          </div>

          {first ? (
            (() => {
              const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(first.url);
              const favicon = getFaviconUrl(first.url);
              return (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-black/60 border border-orange-500/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={favicon}
                        alt=""
                        className="w-6 h-6 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <a
                        href={normalizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-base sm:text-lg font-extrabold text-white hover:text-orange-300 transition-colors flex items-center gap-1.5 truncate group"
                      >
                        <span className="truncate">{displayDomain}</span>
                        <ArrowUpRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                      </a>
                      <p className="text-[11px] text-orange-200/80 font-medium">🏆 Highest Bid on Billboard</p>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-6 text-center text-gray-400 text-xs">
              <p className="font-bold text-orange-300">No Champion Yet!</p>
              <button
                onClick={() => onSelectBidAmount && onSelectBidAmount(5)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold hover:bg-orange-500/30 transition-colors"
              >
                Claim #1 for $5.00
              </button>
            </div>
          )}
        </div>

        {/* #3 Rank Card */}
        <div className="order-3 flex flex-col justify-between p-5 rounded-2xl bg-gray-900/60 border border-amber-900/40 backdrop-blur-xl relative overflow-hidden transition-all hover:border-amber-700/60 hover:scale-[1.01]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-800/20 border border-amber-700/40 text-amber-500 flex items-center justify-center font-black text-sm">
                <Medal className="w-4 h-4 text-amber-500" />
              </div>
              <span className="text-xs font-bold text-amber-500 tracking-wider uppercase">Rank #3</span>
            </div>
            {third && (
              <span className="text-sm font-black text-white px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60">
                {formatCentsToDollars(third.amount)}
              </span>
            )}
          </div>

          {third ? (
            (() => {
              const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(third.url);
              const favicon = getFaviconUrl(third.url);
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black/40 border border-amber-900/50 flex items-center justify-center shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={favicon}
                        alt=""
                        className="w-5 h-5 object-contain"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    </div>
                    <div className="min-w-0">
                      <a
                        href={normalizedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-white hover:text-amber-300 transition-colors flex items-center gap-1.5 truncate group"
                      >
                        <span className="truncate">{displayDomain}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                      </a>
                      <p className="text-[10px] text-gray-400">Verified placement</p>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="py-6 text-center text-gray-400 text-xs">
              <p className="font-semibold text-gray-400">Spot Available</p>
              <button
                onClick={() => onSelectBidAmount && onSelectBidAmount(5)}
                className="mt-2 text-[11px] text-amber-500 hover:text-white underline"
              >
                Claim #3 for $5
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
