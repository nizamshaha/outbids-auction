'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Bid, BidCategory } from '@/types/bid';
import { supabase } from '@/utils/supabase/client';
import { TopPodium } from './TopPodium';
import { LeaderboardCard } from './LeaderboardCard';
import { Flame, RefreshCw, Search, Sparkles, Trophy, Clock, Gift, Tag, ChevronDown } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardProps {
  initialBids?: Bid[];
  onStatsUpdate?: (stats: { count: number; highest: number; totalVolume: number }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onSelectBidAmount?: (amountDollars: number) => void;
  onSelectBidForTopUp?: (bid: Bid) => void;
}

type TabMode = 'top10' | 'top25' | 'latest' | 'free' | 'all';

const CATEGORIES: ('All' | BidCategory)[] = [
  'All',
  'AI',
  'Productivity',
  'SEO',
  'DevTools',
  'Design',
  'Marketing',
  'E-Commerce',
  'Crypto',
  'Other',
];

const ITEMS_PER_PAGE = 10;

export function Leaderboard({
  initialBids = [],
  onStatsUpdate,
  onConnectionChange,
  onSelectBidAmount,
  onSelectBidForTopUp,
}: LeaderboardProps) {
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [loading, setLoading] = useState(initialBids.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Filter & Section State
  const [activeTab, setActiveTab] = useState<TabMode>('top25');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const onStatsUpdateRef = useRef(onStatsUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onStatsUpdate, onConnectionChange]);

  // Helper to sort bids by amount DESC, then created_at ASC
  const sortRankBids = useCallback((bidList: Bid[]) => {
    return [...bidList].sort((a, b) => {
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, []);

  // Compute and emit stats
  const emitStats = useCallback(
    (currentBids: Bid[]) => {
      if (!onStatsUpdateRef.current) return;
      const count = currentBids.length;
      const highest = currentBids.length > 0 ? currentBids[0].amount : 0;
      const totalVolume = currentBids.reduce((acc, b) => acc + b.amount, 0);
      onStatsUpdateRef.current({ count, highest, totalVolume });
    },
    []
  );

  // Fetch initial list of paid bids
  const fetchPaidBids = useCallback(async () => {
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('bids')
        .select('*')
        .eq('status', 'paid')
        .order('amount', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      const sorted = sortRankBids((data as Bid[]) || []);
      setBids(sorted);
      emitStats(sorted);
    } catch (err: any) {
      console.error('Error loading bids:', err);
      setError(err?.message || 'Failed to load leaderboard bids.');
    } finally {
      setLoading(false);
    }
  }, [sortRankBids, emitStats]);

  useEffect(() => {
    fetchPaidBids();
  }, [fetchPaidBids]);

  // Subscribe to Supabase Realtime postgres_changes
  useEffect(() => {
    const channel = supabase
      .channel('public:bids')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          console.log('[Realtime Update] Received payload:', payload);
          const { eventType, new: newRow, old: oldRow } = payload;

          setBids((prevBids) => {
            let updatedList = [...prevBids];

            if (eventType === 'INSERT') {
              const insertedBid = newRow as Bid;
              if (insertedBid.status === 'paid') {
                if (!updatedList.some((b) => b.id === insertedBid.id)) {
                  updatedList.push(insertedBid);
                  const currentTop = updatedList[0]?.amount || 0;
                  if (insertedBid.amount >= currentTop && insertedBid.amount > 0) {
                    try {
                      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
                    } catch {}
                  }
                }
              }
            } else if (eventType === 'UPDATE') {
              const updatedBid = newRow as Bid;
              const existingIndex = updatedList.findIndex((b) => b.id === updatedBid.id);

              if (updatedBid.status === 'paid') {
                if (existingIndex >= 0) {
                  updatedList[existingIndex] = updatedBid;
                } else {
                  updatedList.push(updatedBid);
                }
                const currentTop = updatedList.length > 0 ? updatedList[0].amount : 0;
                if (updatedBid.amount >= currentTop && updatedBid.amount > 0) {
                  try {
                    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
                  } catch {}
                }
              } else {
                if (existingIndex >= 0) {
                  updatedList.splice(existingIndex, 1);
                }
              }
            } else if (eventType === 'DELETE') {
              const deletedBid = oldRow as Bid;
              updatedList = updatedList.filter((b) => b.id !== deletedBid.id);
            }

            const sorted = sortRankBids(updatedList);
            emitStats(sorted);
            return sorted;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          onConnectionChangeRef.current?.(true);
        } else if (status === 'TIMED_OUT' || status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          onConnectionChangeRef.current?.(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortRankBids, emitStats]);

  // Handle Outbid / Top-Up Action
  const handleTopUpClick = (bid: Bid) => {
    if (onSelectBidForTopUp) {
      onSelectBidForTopUp(bid);
    } else if (onSelectBidAmount) {
      const nextDollars = Math.ceil(bid.amount / 100) + 5;
      onSelectBidAmount(nextDollars);
    }
  };

  // Filtered & Sorted Bids based on Active Tab, Category, and Search
  const filteredBids = useMemo(() => {
    let result = [...bids];

    // 1. Tab Filtering & Ordering
    if (activeTab === 'latest') {
      result.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
    } else if (activeTab === 'free') {
      result = result.filter((b) => b.amount === 0);
    } else if (activeTab === 'top10') {
      result = result.slice(0, 10);
    } else if (activeTab === 'top25') {
      result = result.slice(0, 25);
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter((b) => (b.category || 'Other').toLowerCase() === selectedCategory.toLowerCase());
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (b) =>
          b.url.toLowerCase().includes(q) ||
          (b.title && b.title.toLowerCase().includes(q)) ||
          (b.description && b.description.toLowerCase().includes(q)) ||
          (b.category && b.category.toLowerCase().includes(q))
      );
    }

    return result;
  }, [bids, activeTab, selectedCategory, searchQuery]);

  // Paginated slice (showing beyond Top 3 if viewing rank lists)
  const isPodiumVisible = activeTab !== 'latest' && activeTab !== 'free' && !searchQuery && selectedCategory === 'All';
  const listItems = isPodiumVisible ? filteredBids.slice(3) : filteredBids;
  const paginatedItems = listItems.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* Top 3 Podium (Displayed for overall rankings) */}
      {isPodiumVisible && (
        <TopPodium topBids={bids.slice(0, 3)} onSelectBidAmount={onSelectBidAmount} />
      )}

      {/* --- LEADERBOARD CONTROLS & SECTIONS --- */}
      <div className="w-full mt-10 mb-6 space-y-4">
        {/* Section Tabs Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-950/80 border border-gray-800 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('top25');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'top25'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>Top 25</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('top10');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'top10'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Top 10</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('latest');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'latest'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest Activity</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('free');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'free'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Free Tier</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              placeholder="Search website, title, or tags..."
              className="w-full pl-8 pr-3 py-2 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-gray-200 text-black'
                  : 'bg-gray-900/90 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && bids.length === 0 && (
        <div className="space-y-3 my-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-20 rounded-2xl glass-card animate-pulse p-4" />
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-300 my-4">
          <p>{error}</p>
          <button
            onClick={fetchPaidBids}
            className="mt-2 text-xs font-semibold text-red-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try reloading</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBids.length === 0 && !error && (
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border-dashed border-gray-800 my-6">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">No listings found</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All'
              ? 'Try changing your search keywords or category filters.'
              : 'Be the first website to claim a spot on the live digital billboard!'}
          </p>
        </div>
      )}

      {/* Rich Rankings List */}
      <div className="space-y-3 my-4">
        {paginatedItems.map((bid, index) => {
          const rank = isPodiumVisible ? index + 4 : index + 1;
          return (
            <LeaderboardCard
              key={bid.id}
              bid={bid}
              rank={rank}
              onTopUp={handleTopUpClick}
            />
          );
        })}
      </div>

      {/* Pagination / Load More Button */}
      {listItems.length > visibleCount && (
        <div className="text-center pt-6 pb-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-gray-200 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Load More Placements ({listItems.length - visibleCount} remaining)</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      )}
    </div>
  );
}
