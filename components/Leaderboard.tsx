'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bid } from '@/types/bid';
import { supabase } from '@/utils/supabase/client';
import { TopPodium } from './TopPodium';
import { RankingsTable } from './RankingsTable';
import { Flame, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardProps {
  initialBids?: Bid[];
  onStatsUpdate?: (stats: { count: number; highest: number; totalVolume: number }) => void;
  onConnectionChange?: (connected: boolean) => void;
  onSelectBidAmount?: (amountDollars: number) => void;
}

export function Leaderboard({
  initialBids = [],
  onStatsUpdate,
  onConnectionChange,
  onSelectBidAmount,
}: LeaderboardProps) {
  const [bids, setBids] = useState<Bid[]>(initialBids);
  const [loading, setLoading] = useState(initialBids.length === 0);
  const [error, setError] = useState<string | null>(null);

  // Keep latest callbacks in refs to prevent unnecessary useEffect re-subscriptions
  const onStatsUpdateRef = useRef(onStatsUpdate);
  const onConnectionChangeRef = useRef(onConnectionChange);

  useEffect(() => {
    onStatsUpdateRef.current = onStatsUpdate;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onStatsUpdate, onConnectionChange]);

  // Helper to re-sort bids by amount DESC, then created_at ASC
  const sortBids = useCallback((bidList: Bid[]) => {
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

      const sorted = sortBids((data as Bid[]) || []);
      setBids(sorted);
      emitStats(sorted);
    } catch (err: any) {
      console.error('Error loading bids:', err);
      setError(err?.message || 'Failed to load leaderboard bids.');
    } finally {
      setLoading(false);
    }
  }, [sortBids, emitStats]);

  // Initial data load
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
          event: '*', // Listen to INSERT, UPDATE, DELETE
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
                  if (insertedBid.amount >= currentTop) {
                    try {
                      confetti({
                        particleCount: 90,
                        spread: 70,
                        origin: { y: 0.6 },
                      });
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
                  const currentTop = updatedList.length > 0 ? updatedList[0].amount : 0;
                  if (updatedBid.amount >= currentTop) {
                    try {
                      confetti({
                        particleCount: 100,
                        spread: 80,
                        origin: { y: 0.5 },
                      });
                    } catch {}
                  }
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

            const sorted = sortBids(updatedList);
            emitStats(sorted);
            return sorted;
          });
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          if (onConnectionChangeRef.current) {
            onConnectionChangeRef.current(true);
          }
        } else if (
          status === 'TIMED_OUT' ||
          status === 'CLOSED' ||
          status === 'CHANNEL_ERROR'
        ) {
          if (onConnectionChangeRef.current) {
            onConnectionChangeRef.current(false);
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sortBids, emitStats]);

  return (
    <div className="w-full">
      {/* Loading state */}
      {loading && bids.length === 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 rounded-2xl glass-card animate-pulse p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-gray-800" />
                <div className="w-16 h-6 rounded-lg bg-gray-800" />
              </div>
              <div className="w-32 h-5 bg-gray-800 rounded" />
              <div className="w-24 h-3 bg-gray-800/60 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-300 my-4">
          <p>{error}</p>
          <button
            onClick={fetchPaidBids}
            className="mt-2 text-xs font-semibold text-red-400 hover:underline inline-flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Try reloading</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && bids.length === 0 && !error && (
        <div className="glass-panel rounded-3xl p-8 sm:p-12 text-center border-dashed border-gray-800 my-8">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mx-auto mb-3">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-white">Billboard Is Empty!</h3>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Be the very first website to claim the <strong className="text-orange-400">#1 position</strong> for just $5.00.
          </p>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      <TopPodium topBids={bids.slice(0, 3)} onSelectBidAmount={onSelectBidAmount} />

      {/* Dense Live Rankings Table for #4+ */}
      <RankingsTable bids={bids} />
    </div>
  );
}
