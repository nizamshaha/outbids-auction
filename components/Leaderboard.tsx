'use client';

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { Bid } from '@/types/bid';
import { supabase } from '@/utils/supabase/client';
import { LeaderboardCard } from './LeaderboardCard';
import { MidnightCountdown } from './MidnightCountdown';
import { getWatchlist, saveRankSnapshot } from '@/utils/watchlist';
import { Flame, RefreshCw, Search, Sparkles, Trophy, Clock, Gift, Star, Calendar, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardProps {
  initialBids?: Bid[];
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onStatsUpdate?: (stats: { count: number; highest: number; totalVolume: number }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onSelectBidAmount?: (amountDollars: number) => void;
  onSelectBidForTopUp?: (bid: Bid) => void;
  onCategoryCountsCalculated?: (counts: Record<string, number>, total: number) => void;
}

export type TemporalTab = 'all' | 'today' | 'week' | 'latest' | 'watchlist' | 'free';

const ITEMS_PER_PAGE = 10;

export function Leaderboard({
  initialBids = [],
  selectedCategory = 'All',
  onSelectCategory,
  onStatsUpdate,
  onConnectionChange,
  onSelectBidAmount,
  onSelectBidForTopUp,
  onCategoryCountsCalculated,
}: LeaderboardProps) {
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [loading, setLoading] = useState(initialBids.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Filter & Section State
  const [activeTab, setActiveTab] = useState<TemporalTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [watchlistVersion, setWatchlistVersion] = useState(0);

  const onStatsUpdateRef = useRef(onStatsUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onCategoryCountsRef = useRef(onCategoryCountsCalculated);

  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
    onConnectionChangeRef.current = onConnectionChange;
    onCategoryCountsRef.current = onCategoryCountsCalculated;
  }, [onStatsUpdate, onConnectionChange, onCategoryCountsCalculated]);

  // Helper to sort bids by amount DESC, then created_at ASC
  const sortRankBids = useCallback((bidList: Bid[]) => {
    return [...bidList].sort((a, b) => {
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, []);

  // Compute and emit stats + record rank snapshot
  const emitStatsAndSnapshot = useCallback(
    (currentBids: Bid[]) => {
      if (!onStatsUpdateRef.current) return;
      const count = currentBids.length;
      const highest = currentBids.length > 0 ? currentBids[0].amount : 0;
      const totalVolume = currentBids.reduce((acc, b) => acc + b.amount, 0);
      onStatsUpdateRef.current({ count, highest, totalVolume });

      // Calculate category counts
      const counts: Record<string, number> = {};
      currentBids.forEach((b) => {
        const cat = (b.category || 'Other').toLowerCase();
        counts[cat] = (counts[cat] || 0) + 1;
      });
      onCategoryCountsRef.current?.(counts, count);

      // Save rank snapshots for rank movement delta calculation
      const snapshot = currentBids.map((b, idx) => ({ id: b.id, rank: idx + 1 }));
      saveRankSnapshot(snapshot);
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
      emitStatsAndSnapshot(sorted);
    } catch (err: any) {
      console.error('Error loading bids:', err);
      setError(err?.message || 'Failed to load leaderboard bids.');
    } finally {
      setLoading(false);
    }
  }, [sortRankBids, emitStatsAndSnapshot]);

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
            emitStatsAndSnapshot(sorted);
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
  }, [sortRankBids, emitStatsAndSnapshot]);

  // Handle Outbid / Top-Up Action
  const handleTopUpClick = (bid: Bid) => {
    if (onSelectBidForTopUp) {
      onSelectBidForTopUp(bid);
    } else if (onSelectBidAmount) {
      const nextDollars = Math.ceil(bid.amount / 100) + 1;
      onSelectBidAmount(nextDollars);
    }
  };

  const handleWatchlistChanged = () => {
    setWatchlistVersion((v) => v + 1);
  };

  // Filtered & Sorted Bids based on Temporal Tab, Category, and Search
  const filteredBids = useMemo(() => {
    let result = [...bids];
    const now = new Date();

    // 1. Temporal & View Tab Filter
    if (activeTab === 'today') {
      const startOfTodayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
      );
      result = result.filter((b) => new Date(b.created_at) >= startOfTodayUTC);
    } else if (activeTab === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter((b) => new Date(b.created_at) >= sevenDaysAgo);
    } else if (activeTab === 'latest') {
      result.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.created_at).getTime();
        const timeB = new Date(b.updated_at || b.created_at).getTime();
        return timeB - timeA;
      });
    } else if (activeTab === 'watchlist') {
      const savedIds = getWatchlist();
      result = result.filter((b) => savedIds.includes(b.id));
    } else if (activeTab === 'free') {
      result = result.filter((b) => b.amount === 0);
    }

    // 2. Category Filter
    if (selectedCategory !== 'All') {
      result = result.filter(
        (b) => (b.category || 'Other').toLowerCase() === selectedCategory.toLowerCase()
      );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bids, activeTab, selectedCategory, searchQuery, watchlistVersion]);

  const paginatedItems = filteredBids.slice(0, visibleCount);

  return (
    <div className="w-full">
      {/* --- LEADERBOARD CONTROLS & TEMPORAL TABS --- */}
      <div className="w-full mb-6 space-y-4">
        {/* Temporal Tabs + Midnight Countdown Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-800">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-950/80 border border-gray-800 text-xs font-bold overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('all');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>All-Time</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('today');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'today'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Today</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('week');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'week'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('latest');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'latest'
                  ? 'bg-orange-500 text-black shadow-md shadow-orange-500/20 font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest Activity</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('watchlist');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'watchlist'
                  ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-black'
                  : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <Star className="w-3.5 h-3.5" />
              <span>Watchlist</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('free');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'free'
                  ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black'
                  : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Free Tier</span>
            </button>
          </div>

          {/* Right: Midnight UTC Timer & Search */}
          <div className="flex items-center gap-2.5">
            {activeTab === 'today' && <MidnightCountdown />}

            <div className="relative w-full sm:w-56">
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
                placeholder="Search listings..."
                className="w-full pl-8 pr-3 py-1.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && bids.length === 0 && (
        <div className="space-y-3 my-6">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-24 rounded-2xl glass-card animate-pulse p-4" />
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
          <h3 className="text-lg font-black text-white">
            {activeTab === 'watchlist' ? 'Your Watchlist is Empty' : 'No listings found'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            {activeTab === 'watchlist'
              ? 'Click the star icon on any card to track its rank movement and position over time.'
              : searchQuery || selectedCategory !== 'All'
              ? 'Try changing your search keywords or category filters.'
              : 'Be the first website to claim a spot on the live digital billboard!'}
          </p>
        </div>
      )}

      {/* Rich Rankings List with Elevated Podium & Highlighted #1 */}
      <div className="space-y-3.5 my-4">
        {paginatedItems.map((bid, index) => {
          const rank = index + 1;
          const showTop10Divider = rank === 11;

          return (
            <React.Fragment key={bid.id}>
              {showTop10Divider && (
                <div className="flex items-center gap-3 py-3 my-2">
                  <div className="h-px bg-gray-850 flex-1" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-orange-400/80 px-2 flex items-center gap-1.5">
                    <Trophy className="w-3 h-3 text-orange-400" />
                    Top 10 Spotlight Ends • Next Contenders
                  </span>
                  <div className="h-px bg-gray-850 flex-1" />
                </div>
              )}

              <LeaderboardCard
                bid={bid}
                rank={rank}
                onTopUp={handleTopUpClick}
                onWatchlistChanged={handleWatchlistChanged}
              />
            </React.Fragment>
          );
        })}
      </div>

      {/* Pagination / Load More Button */}
      {filteredBids.length > visibleCount && (
        <div className="text-center pt-6 pb-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            className="px-5 py-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-xs font-bold text-gray-200 transition-colors inline-flex items-center gap-2 cursor-pointer shadow-lg"
          >
            <span>Load More Placements ({filteredBids.length - visibleCount} remaining)</span>
          </button>
        </div>
      )}
    </div>
  );
}
