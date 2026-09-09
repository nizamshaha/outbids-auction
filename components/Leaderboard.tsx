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
  Share2,
  Check,
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
  refreshTrigger?: number;
  onOptimisticBid?: Bid | null;
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
  refreshTrigger,
  onOptimisticBid,
}: LeaderboardProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [watchlistVersion, setWatchlistVersion] = useState(0);
  const [copiedGlobalShare, setCopiedGlobalShare] = useState(false);

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

      let query = supabase
        .from('bids')
        .select('*')
        .eq('status', 'paid');

      // Dynamic Category Filtering
      if (selectedCategory && selectedCategory.toLowerCase() !== 'all') {
        query = query.ilike('category', selectedCategory);
      }

      // Tie-Breaking Logic: ORDER BY amount DESC, created_at ASC
      query = query
        .order('amount', { ascending: false })
        .order('created_at', { ascending: true });

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Cumulative Top-Ups: Aggregate total payment amount per listing_id / url
      const aggregatedMap = new Map<string, Bid>();
      ((data as Bid[]) || []).forEach((row) => {
        const key = row.id || row.url;
        const existing = aggregatedMap.get(key);
        if (existing) {
          existing.amount += (row.amount || 0);
          // Preserve earliest created_at for deterministic tie-breaking (older wins ties)
          if (new Date(row.created_at).getTime() < new Date(existing.created_at).getTime()) {
            existing.created_at = row.created_at;
          }
          if (row.click_count) {
            existing.click_count = (existing.click_count || 0) + row.click_count;
          }
        } else {
          aggregatedMap.set(key, { ...row });
        }
      });

      const aggregatedList = Array.from(aggregatedMap.values());
      const sortedData = sortRankBids(aggregatedList);
      setBids(sortedData);
      emitStatsAndSnapshot(sortedData);
    } catch (err: any) {
      console.error('Error fetching bids:', err);
      setError(err.message || 'Failed to load leaderboard data.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortRankBids, emitStatsAndSnapshot]);

  // Instant Optimistic Bid Injection (0ms UI update upon checkout completion)
  useEffect(() => {
    if (!onOptimisticBid) return;
    setBids((prev) => {
      let updatedList = [...prev];
      const existingIndex = updatedList.findIndex(
        (b) => b.id === onOptimisticBid.id || b.url === onOptimisticBid.url
      );
      if (existingIndex >= 0) {
        updatedList[existingIndex] = { ...updatedList[existingIndex], ...onOptimisticBid };
      } else {
        updatedList.push(onOptimisticBid);
      }
      const sorted = sortRankBids(updatedList);
      emitStatsAndSnapshot(sorted);
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      } catch (e) {}
      return sorted;
    });
  }, [onOptimisticBid, sortRankBids, emitStatsAndSnapshot]);

  // Trigger re-fetch when external refresh counter or selected category changes
  useEffect(() => {
    fetchPaidBids();
  }, [refreshTrigger, selectedCategory, fetchPaidBids]);

  // Self-Healing Window Focus & Tab Visibility Re-Sync + 15s Heartbeat
  useEffect(() => {
    const onFocusOrVisible = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPaidBids();
      }
    };

    window.addEventListener('visibilitychange', onFocusOrVisible);
    window.addEventListener('focus', onFocusOrVisible);

    const heartbeat = setInterval(onFocusOrVisible, 15000);

    return () => {
      window.removeEventListener('visibilitychange', onFocusOrVisible);
      window.removeEventListener('focus', onFocusOrVisible);
      clearInterval(heartbeat);
    };
  }, [fetchPaidBids]);

  // Realtime Supabase Postgres Channel
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
                const existingIndex = updatedList.findIndex(
                  (b) => b.id === insertedBid.id || b.url === insertedBid.url
                );
                if (existingIndex >= 0) {
                  updatedList[existingIndex] = insertedBid;
                } else {
                  updatedList.push(insertedBid);
                }
                const currentTop = updatedList.length > 0 ? updatedList[0].amount : 0;
                if (insertedBid.amount >= currentTop && insertedBid.amount > 0) {
                  try {
                    confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
                  } catch (e) {}
                }
              }
            } else if (eventType === 'UPDATE') {
              const updatedBid = newRow as Bid;
              const existingIndex = updatedList.findIndex((b) => b.id === updatedBid.id || b.url === updatedBid.url);

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

  const handleGlobalShare = async () => {
    const shareText = `I just claimed my spot on the outbids.auction leaderboard. Outbid me if you can: https://outbids.auction`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Outbids.auction — Live Marketplace for Digital Visibility',
          text: shareText,
          url: 'https://outbids.auction',
        });
        return;
      } catch (err) {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopiedGlobalShare(true);
        setTimeout(() => setCopiedGlobalShare(false), 2200);
      } catch (err) {
        console.error('Clipboard copy failed', err);
      }
    }
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          {/* Temporal Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 border border-gray-200/80 text-xs font-semibold overflow-x-auto scrollbar-none">
            <button
              onClick={() => {
                setActiveTab('all');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-gray-900 font-bold shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
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
                  ? 'bg-white text-gray-900 font-bold shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FF4B4B]" />
              <span>Today (24h)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('week');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'week'
                  ? 'bg-white text-gray-900 font-bold shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
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
                  ? 'bg-white text-gray-900 font-bold shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Latest</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('watchlist');
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === 'watchlist'
                  ? 'bg-white text-gray-900 font-bold shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
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
                  ? 'bg-white text-emerald-800 font-bold shadow-xs border border-gray-200/80'
                  : 'text-gray-500 hover:text-gray-900'
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
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(ITEMS_PER_PAGE);
              }}
              placeholder="Search by title, domain, category..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 bg-white text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#FF4B4B] focus:border-[#FF4B4B] shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2.5 text-xs text-gray-500 font-medium w-full sm:w-auto justify-between sm:justify-end">
            <span>
              Showing <strong className="text-gray-900 font-bold">{filteredBids.length}</strong> listings
              {selectedCategory !== 'All' && (
                <span> in <strong className="text-[#FF4B4B] font-bold">{selectedCategory}</strong></span>
              )}
            </span>

            {/* Share Board Button */}
            <button
              onClick={handleGlobalShare}
              className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold ${
                copiedGlobalShare
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
              }`}
              title="Share Leaderboard"
            >
              {copiedGlobalShare ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#FF4B4B]" />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={() => fetchPaidBids()}
              disabled={loading}
              title="Refresh Leaderboard"
              className="p-1.5 rounded-lg border border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 transition-colors cursor-pointer text-gray-500 hover:text-gray-900"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#FF4B4B]' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* --- ERROR / LOADING STATES --- */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-6">
          {error}
        </div>
      )}

      {loading && bids.length === 0 && (
        <div className="space-y-3 my-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-5 rounded-xl border border-gray-100 bg-white animate-pulse h-20"
            />
          ))}
        </div>
      )}

      {/* --- EMPTY STATE --- */}
      {!loading && filteredBids.length === 0 && (
        <div className="p-12 text-center rounded-2xl border border-gray-200 bg-white my-8 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-gray-100 text-[#FF4B4B] flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            ✧
          </div>
          <h3 className="text-lg font-bold text-gray-900">
            {activeTab === 'watchlist' ? 'Your Watchlist is Empty' : 'No listings found'}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
            {activeTab === 'watchlist'
              ? 'Click the star icon on any card to track its rank movement and position over time.'
              : searchQuery || selectedCategory !== 'All'
              ? 'Try changing your search keywords or category filters.'
              : 'Be the first website to claim a spot on the live marketplace for digital visibility!'}
          </p>
        </div>
      )}

      {/* Edge-to-Edge Clean Minimalist Feed Items */}
      <div className="border border-gray-100 my-4 bg-white rounded-xl overflow-hidden shadow-2xs">
        {paginatedItems.map((bid, index) => {
          const rank = index + 1;
          const showTop10Divider = rank === 11;

          return (
            <React.Fragment key={bid.id}>
              {showTop10Divider && (
                <div className="relative py-2 px-4 flex items-center justify-center bg-gray-50 border-b border-gray-100">
                  <div className="absolute inset-0 flex items-center px-4">
                    <div className="w-full border-t border-dashed border-gray-200" />
                  </div>
                  <span className="relative px-3 bg-gray-50 text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
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
