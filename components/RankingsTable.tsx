'use client';

import React from 'react';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { ExternalLink, ListOrdered, ArrowUpRight } from 'lucide-react';

interface RankingsTableProps {
  bids: Bid[];
}

export function RankingsTable({ bids }: RankingsTableProps) {
  // Ranks #4 and beyond
  const listBids = bids.slice(3);

  if (listBids.length === 0) {
    return null;
  }

  return (
    <div className="w-full my-8">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-gray-300">
            Live Rankings (#4+)
          </h3>
        </div>
        <span className="text-[11px] text-gray-400 font-semibold">{listBids.length} active placements</span>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950/70 backdrop-blur-xl overflow-hidden shadow-xl">
        <div className="divide-y divide-gray-800/80">
          {listBids.map((bid, index) => {
            const rank = index + 4;
            const { displayDomain, normalizedUrl } = sanitizeAndNormalizeUrl(bid.url);
            const favicon = getFaviconUrl(bid.url);

            return (
              <div
                key={bid.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-gray-900/60 transition-colors group"
              >
                {/* Left: Rank + Favicon + Domain */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="w-6 text-center font-bold text-gray-400 text-xs shrink-0">
                    #{rank}
                  </span>

                  <div className="w-6 h-6 rounded-md bg-gray-900 border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={favicon}
                      alt=""
                      className="w-4 h-4 object-contain"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>

                  <a
                    href={normalizedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-gray-200 hover:text-indigo-400 transition-colors truncate flex items-center gap-1.5"
                  >
                    <span className="truncate max-w-[180px] sm:max-w-sm md:max-w-md">{displayDomain}</span>
                    <ExternalLink className="w-3 h-3 text-gray-400 group-hover:text-indigo-400 opacity-60 group-hover:opacity-100 shrink-0 transition-opacity" />
                  </a>
                </div>

                {/* Right: Amount */}
                <div className="flex items-center gap-2 shrink-0 pl-3">
                  <span className="text-xs font-black text-white px-2.5 py-1 rounded-lg bg-gray-900 border border-gray-800">
                    {formatCentsToDollars(bid.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
