'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Bid } from '@/types/bid';
import { LeaderboardCard } from './LeaderboardCard';
import { getWatchlist } from '@/utils/watchlist';
import confetti from 'canvas-confetti';
import {
  Globe,
  Sparkles,
  Calendar,
  Clock,
  Star,
  Gift,
  Search,
  RefreshCw,
  Trophy,
  Flame,
} from 'lucide-react';

interface LeaderboardProps {
  onStatsUpdate?: (highestBidCents: number, totalBids: number, totalVolumeCents: number) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onSelectBidAmount?: (amountDollars: number) => void;
  onSelectBidForTopUp?: (bid: Bid) => void;
  onCategoryMetricsCalculated?: (
    categoryPools: Record<string, number>,
    categoryCounts: Record<string, number>,
    totalPoolDollars: number,
    totalCount: number
  ) => void;
  selectedCategory?: string;
}

type TabType = 'all' | 'today' | 'week' | 'latest' | 'watchlist' | 'free';

const ITEMS_PER_PAGE = 50;

function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setUTCHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
          .toString()
          .padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant text-[11px] font-bold text-text-muted">
      <Clock className="w-3.5 h-3.5 text-primary" />
      <span>Resets in {timeLeft} UTC</span>
    </div>
  );
}

export function Leaderboard({
  onStatsUpdate,
  onConnectionChange,
  onSelectBidAmount,
  onSelectBidForTopUp,
  onCategoryMetricsCalculated,
  selectedCategory = 'All',
}: LeaderboardProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [watchlistVersion, setWatchlistVersion] = useState(0);

  const onStatsUpdateRef = useRef(onStatsUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);
  const onCategoryMetricsRef = useRef(onCategoryMetricsCalculated);

  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
    onConnectionChangeRef.current = onConnectionChange;
    onCategoryMetricsRef.current = onCategoryMetricsCalculated;
  });

  const sortRankBids = useCallback((bidList: Bid[]): Bid[] => {
    return [...bidList].sort((a, b) => {
      if (b.amount !== a.amount) {
        return b.amount - a.amount;
      }
      // Tie-breaker: Earlier timestamp preserves higher rank
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }, []);

  const emitStatsAndSnapshot = useCallback((bidList: Bid[]) => {
    const paidList = bidList.filter((b) => b.status === 'paid' && b.amount > 0);
    const highestBidCents = paidList.length > 0 ? paidList[0].amount : 0;
    const totalBids = bidList.filter((b) => b.status === 'paid').length;
    const totalVolumeCents = paidList.reduce((acc, curr) => acc + curr.amount, 0);

    onStatsUpdateRef.current?.(highestBidCents, totalBids, totalVolumeCents);

    // Calculate Category Pool Metrics
    const pools: Record<string, number> = {};
    const counts: Record<string, number> = {};
    let totalPoolCents = 0;
    let totalCount = 0;

    bidList.forEach((bid) => {
      if (bid.status === 'paid') {
        const catKey = (bid.category || 'Other').toLowerCase();
        pools[catKey] = (pools[catKey] || 0) + Math.round(bid.amount / 100);
        counts[catKey] = (counts[catKey] || 0) + 1;
        totalPoolCents += bid.amount;
        totalCount += 1;
      }
    });

    onCategoryMetricsRef.current?.(pools, counts, Math.round(totalPoolCents / 100), totalCount);
  }, []);

  const fetchPaidBids = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('bids')
        .select('*')
        .eq('status', 'paid')
        .order('amount', { ascending: false })
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;

      const sortedData = sortRankBids((data as Bid[]) || []);
      setBids(sortedData);
      emitStatsAndSnapshot(sortedData);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      setError(err.message || 'Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  }, [sortRankBids, emitStatsAndSnapshot]);

  useEffect(() => {
    fetchPaidBids();

    const channel = supabase
      .channel('public:bids:realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bids',
        },
        (payload) => {
          const { eventType, new: newRow, old: oldRow } = payload;

          setBids((prev) => {
            let updatedList = [...prev];

            if (eventType === 'INSERT') {
              const insertedBid = newRow as Bid;
              if (insertedBid.status === 'paid') {
                updatedList.push(insertedBid);
                const currentTop = updatedList.length > 0 ? updatedList[0].amount : 0;
                if (insertedBid.amount >= currentTop && insertedBid.amount > 0) {
                  try {
                    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
                  } catch (e) {}
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
                  } catch (e) {}
                }
              } else {
                if (existingIndex >= 0) {
                  updatedList.splice(existingIndex, 1);
                }
              }
            } else if (eventType === 'DELETE') {
              const deletedId = (oldRow as Bid).id;
              updatedList = updatedList.filter((b) => b.id !== deletedId);
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
  }, [fetchPaidBids, sortRankBids, emitStatsAndSnapshot]);

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

  // Dual-Board Engine: Filter and sort bids based on activeTab, category, and search query
  const filteredBids = useMemo(() => {
    let result = [...bids];
    const now = new Date();

    // 1. Dual-Board & Temporal Tabs
    if (activeTab === 'today') {
      // 24-Hour Rolling Sliding Window
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      result = result.filter(
        (b) => new Date(b.updated_at || b.created_at) >= twentyFourHoursAgo
      );
    } else if (activeTab === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      result = result.filter(
        (b) => new Date(b.updated_at || b.created_at) >= sevenDaysAgo
      );
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
      {/* --- LEADERBOARD CONTROLS & TABS --- */}
      <div className="w-full mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant">
          {/* Sahara Temporal Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-surface-container border border-outline-variant text-xs font-semibold overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('all');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-surface text-text-main font-bold shadow-sm border border-outline-variant'
                  : 'text-text-muted hover:text-text-main'
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
                  ? 'bg-surface text-text-main font-bold shadow-sm border border-outline-variant'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Today (24h)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('week');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'week'
                  ? 'bg-surface text-text-main font-bold shadow-sm border border-outline-variant'
                  : 'text-text-muted hover:text-text-main'
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
                  ? 'bg-surface text-text-main font-bold shadow-sm border border-outline-variant'
                  : 'text-text-muted hover:text-text-main'
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
                  ? 'bg-surface text-text-main font-bold shadow-sm border border-outline-variant'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Watchlist</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('free');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'free'
                  ? 'bg-surface text-emerald-800 font-bold shadow-sm border border-outline-variant'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-emerald-600" />
              <span>Free Tier</span>
            </button>
          </div>

          {/* Midnight Countdown */}
          <MidnightCountdown />
        </div>

        {/* Search Bar & Active Category Tag */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              placeholder="Search listings by title, domain, or category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-outline-variant bg-surface text-xs text-on-surface placeholder:text-text-muted/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted font-medium w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Showing <strong className="text-on-surface">{filteredBids.length}</strong> listings
              {selectedCategory !== 'All' && (
                <span> in <strong className="text-primary font-bold">{selectedCategory}</strong></span>
              )}
            </span>

            <button
              onClick={() => fetchPaidBids()}
              disabled={loading}
              title="Refresh Leaderboard"
              className="p-1.5 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors cursor-pointer text-text-muted hover:text-on-surface"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* --- ERROR / LOADING STATES --- */}
      {error && (
        <div className="p-4 rounded-xl bg-error-container border border-error/20 text-error text-xs mb-6">
          {error}
        </div>
      )}

      {loading && bids.length === 0 && (
        <div className="space-y-4 my-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-outline-variant bg-surface animate-pulse h-28"
            />
          ))}
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!loading && filteredBids.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-outline-variant bg-surface my-8 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mx-auto mb-3 font-display font-bold text-xl">
            ✧
          </div>
          <h3 className="text-lg font-bold text-on-surface font-display">
            {activeTab === 'watchlist' ? 'Your Watchlist is Empty' : 'No listings found'}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted mt-1 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'watchlist'
              ? 'Click the star icon on any card to track its rank movement and position over time.'
              : searchQuery || selectedCategory !== 'All'
              ? 'Try changing your search keywords or category filters.'
              : 'Be the first website to claim a spot on the live marketplace for digital visibility!'}
          </p>
        </div>
      )}

      {/* Sahara Feed Items */}
      <div className="space-y-4 my-4">
        {paginatedItems.map((bid, index) => {
          const rank = index + 1;
          const showTop10Divider = rank === 11;

          return (
            <React.Fragment key={bid.id}>
              {showTop10Divider && (
                <div className="relative py-4 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-dashed border-outline-variant" />
                  </div>
                  <span className="relative px-3 bg-background text-[10px] font-bold text-text-muted uppercase tracking-widest">
                    ─── TOP 10 SPOTLIGHT CUTOFF ───
                  </span>
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

      {/* --- PAGINATION (LOAD MORE) --- */}
      {filteredBids.length > visibleCount && (
        <div className="text-center pt-8 pb-4">
          <button
            onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
            className="px-6 py-2.5 rounded-xl border border-outline-variant bg-surface hover:bg-surface-container transition-colors text-xs font-bold text-text-main cursor-pointer shadow-xs"
          >
            Load Next {Math.min(ITEMS_PER_PAGE, filteredBids.length - visibleCount)} Listings ({visibleCount} of {filteredBids.length})
          </button>
        </div>
      )}
    </div>
  );
}
