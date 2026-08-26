'use client';

import React, { useState, useEffect } from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { isWatchlisted, toggleWatchlist, getRankDelta, RankDeltaInfo } from '@/utils/watchlist';
import { Crown, Medal, Sparkles, ArrowUpRight, MousePointerClick, Tag, Star } from 'lucide-react';

interface TopPodiumProps {
  topBids: Bid[];
  onSelectBidAmount?: (amountDollars: number) => void;
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

export function TopPodium({ topBids, onSelectBidAmount, onWatchlistChanged }: TopPodiumProps) {
  const first = topBids[0] || null;
  const second = topBids[1] || null;
  const third = topBids[2] || null;

  const [watchlistIds, setWatchlistIds] = useState<string[]>([]);

  useEffect(() => {
    const list = topBids.map((b) => b.id).filter((id) => isWatchlisted(id));
    setWatchlistIds(list);
  }, [topBids]);

  const handleToggleStar = (bidId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowBookmarked = toggleWatchlist(bidId);
    setWatchlistIds((prev) =>
      isNowBookmarked ? [...prev, bidId] : prev.filter((id) => id !== bidId)
    );
    onWatchlistChanged?.();
  };

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
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-400/20 border border-slate-400/40 text-slate-200 flex items-center justify-center font-black text-sm">
                  <Medal className="w-4 h-4 text-slate-300" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-300 tracking-wider uppercase">Rank #2</span>
                  {second && <DeltaBadge deltaInfo={getRankDelta(second.id, 2)} />}
                </div>
              </div>
              {second && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleToggleStar(second.id, e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Bookmark to Watchlist"
                    aria-label="Bookmark to Watchlist"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        watchlistIds.includes(second.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-black text-white px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700">
                    {second.amount > 0 ? formatCentsToDollars(second.amount) : 'Free'}
                  </span>
                </div>
              )}
            </div>

            {second ? (
              (() => {
                const { displayDomain } = sanitizeAndNormalizeUrl(second.url);
                const favicon = second.icon_url || getFaviconUrl(second.url);
                return (
                  <div className="space-y-2.5 pt-1">
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
                          href={`/go/${second.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white hover:text-slate-300 transition-colors flex items-center gap-1.5 truncate group"
                        >
                          <span className="truncate">{second.title || displayDomain}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                        </a>
                        <p className="text-[10px] text-gray-400 truncate">{displayDomain}</p>
                      </div>
                    </div>

                    {second.description && (
                      <p className="text-xs text-gray-300/80 line-clamp-2 leading-relaxed">
                        {second.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-semibold">
                        <Tag className="w-2.5 h-2.5" />
                        {second.category || 'Other'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MousePointerClick className="w-3 h-3 text-slate-400" />
                        {second.click_count || 0} clicks
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-6 text-center text-gray-400 text-xs">
                <p className="font-semibold text-gray-400">Spot Available</p>
                <button
                  onClick={() => onSelectBidAmount?.(1)}
                  className="mt-2 text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Claim #2 for $1
                </button>
              </div>
            )}
          </div>
        </div>

        {/* #1 Rank Card (Center Highlight - Coral / Orange Glow) */}
        <div className="order-1 md:order-2 flex flex-col justify-between p-6 rounded-2xl bg-gradient-to-b from-orange-500/20 via-orange-950/30 to-black/80 border-2 border-orange-500/70 shadow-2xl shadow-orange-500/20 backdrop-blur-2xl relative overflow-hidden transition-all hover:scale-[1.02]">
          {/* Top accent glow line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/25 border border-orange-400/60 text-orange-400 flex items-center justify-center font-black shadow-lg shadow-orange-500/30 animate-pulse">
                  <Crown className="w-5 h-5 text-orange-300" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black text-orange-400 tracking-wider uppercase block">
                      Champion #1
                    </span>
                    {first && <DeltaBadge deltaInfo={getRankDelta(first.id, 1)} />}
                  </div>
                  <span className="text-[10px] text-orange-300/80 font-medium">Current Leader</span>
                </div>
              </div>
              {first && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleToggleStar(first.id, e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Bookmark to Watchlist"
                    aria-label="Bookmark to Watchlist"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        watchlistIds.includes(first.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  <span className="text-base sm:text-lg font-black text-orange-300 px-3 py-1 rounded-xl bg-orange-950/80 border border-orange-500/50 shadow-inner">
                    {first.amount > 0 ? formatCentsToDollars(first.amount) : 'Free'}
                  </span>
                </div>
              )}
            </div>

            {first ? (
              (() => {
                const { displayDomain } = sanitizeAndNormalizeUrl(first.url);
                const favicon = first.icon_url || getFaviconUrl(first.url);
                return (
                  <div className="space-y-3 pt-1">
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
                          href={`/go/${first.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base sm:text-lg font-extrabold text-white hover:text-orange-300 transition-colors flex items-center gap-1.5 truncate group"
                        >
                          <span className="truncate">{first.title || displayDomain}</span>
                          <ArrowUpRight className="w-4 h-4 text-orange-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform shrink-0" />
                        </a>
                        <p className="text-[11px] text-orange-200/80 font-medium truncate">{displayDomain}</p>
                      </div>
                    </div>

                    {first.description && (
                      <p className="text-xs text-orange-100/90 line-clamp-2 leading-relaxed">
                        {first.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2.5 border-t border-orange-900/40 text-[11px]">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-orange-500/20 text-orange-300 text-[10px] font-bold border border-orange-500/30">
                        <Tag className="w-2.5 h-2.5" />
                        {first.category || 'AI'}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-orange-300/90">
                        <MousePointerClick className="w-3.5 h-3.5 text-orange-400" />
                        {first.click_count || 0} clicks
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-6 text-center text-gray-400 text-xs">
                <p className="font-bold text-orange-300">No Champion Yet!</p>
                <button
                  onClick={() => onSelectBidAmount?.(1)}
                  className="mt-2 px-3 py-1.5 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/40 text-xs font-bold hover:bg-orange-500/30 transition-colors cursor-pointer"
                >
                  Claim #1 for $1.00
                </button>
              </div>
            )}
          </div>
        </div>

        {/* #3 Rank Card */}
        <div className="order-3 flex flex-col justify-between p-5 rounded-2xl bg-gray-900/60 border border-amber-900/40 backdrop-blur-xl relative overflow-hidden transition-all hover:border-amber-700/60 hover:scale-[1.01]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-800/20 border border-amber-700/40 text-amber-500 flex items-center justify-center font-black text-sm">
                  <Medal className="w-4 h-4 text-amber-500" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-amber-500 tracking-wider uppercase">Rank #3</span>
                  {third && <DeltaBadge deltaInfo={getRankDelta(third.id, 3)} />}
                </div>
              </div>
              {third && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleToggleStar(third.id, e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-amber-400 transition-colors cursor-pointer"
                    title="Bookmark to Watchlist"
                    aria-label="Bookmark to Watchlist"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        watchlistIds.includes(third.id) ? 'fill-amber-400 text-amber-400' : 'text-gray-400'
                      }`}
                    />
                  </button>
                  <span className="text-sm font-black text-white px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-800/60">
                    {third.amount > 0 ? formatCentsToDollars(third.amount) : 'Free'}
                  </span>
                </div>
              )}
            </div>

            {third ? (
              (() => {
                const { displayDomain } = sanitizeAndNormalizeUrl(third.url);
                const favicon = third.icon_url || getFaviconUrl(third.url);
                return (
                  <div className="space-y-2.5 pt-1">
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
                          href={`/go/${third.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-white hover:text-amber-300 transition-colors flex items-center gap-1.5 truncate group"
                        >
                          <span className="truncate">{third.title || displayDomain}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 shrink-0" />
                        </a>
                        <p className="text-[10px] text-gray-400 truncate">{displayDomain}</p>
                      </div>
                    </div>

                    {third.description && (
                      <p className="text-xs text-gray-300/80 line-clamp-2 leading-relaxed">
                        {third.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-amber-950/80 text-[11px] text-gray-400">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 text-amber-400 text-[10px] font-semibold">
                        <Tag className="w-2.5 h-2.5" />
                        {third.category || 'Other'}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-gray-400">
                        <MousePointerClick className="w-3 h-3 text-amber-500" />
                        {third.click_count || 0} clicks
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="py-6 text-center text-gray-400 text-xs">
                <p className="font-semibold text-gray-400">Spot Available</p>
                <button
                  onClick={() => onSelectBidAmount?.(1)}
                  className="mt-2 text-[11px] text-amber-500 hover:text-white underline cursor-pointer"
                >
                  Claim #3 for $1
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
