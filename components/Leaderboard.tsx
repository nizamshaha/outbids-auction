'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Bid } from '@/types/bid';
import { supabase } from '@/utils/supabase/client';
import { LeaderboardItem } from './LeaderboardItem';
import { Trophy, Flame, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LeaderboardProps {
  initialBids?: Bid[];
  onStatsUpdate?: (stats: { count: number; highest: number; totalVolume: number }) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function Leaderboard({
  initialBids = [],
  onStatsUpdate,
  onConnectionChange,
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
    console.log('[Supabase Realtime] Initializing subscription to public:bids channel...');
    
    // 1. Create channel
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
                  // Fire confetti if new #1
                  const currentTop = updatedList[0]?.amount || 0;
                  if (insertedBid.amount >= currentTop) {
                    try {
                      confetti({
                        particleCount: 80,
                        spread: 60,
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
                        spread: 70,
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
      .subscribe((status, err) => {
        console.log('[Supabase Realtime Status]:', status, err || '');
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

    // 2. CRITICAL Cleanup: Unsubscribe & remove channel on unmount to prevent React Strict Mode duplicate WebSocket loops
    return () => {
      console.log('[Supabase Realtime] Cleaning up channel...');
      supabase.removeChannel(channel);
    };
  }, [sortBids, emitStats]);

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      {/* Header section of leaderboard */}
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase">
            Live Rankings
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400 font-semibold">
            {bids.length}
          </span>
        </div>

        <button
          onClick={fetchPaidBids}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/60 transition-colors"
          title="Refresh rankings"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Loading state */}
      {loading && bids.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-20 rounded-2xl glass-card animate-pulse flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-800" />
                <div className="space-y-2">
                  <div className="w-32 h-4 bg-gray-800 rounded" />
                  <div className="w-20 h-3 bg-gray-800/60 rounded" />
                </div>
              </div>
              <div className="w-16 h-8 bg-gray-800 rounded-xl" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-sm text-red-300">
          <p>{error}</p>
          <button
            onClick={fetchPaidBids}
            className="mt-2 text-xs font-semibold text-red-400 hover:underline"
          >
            Try reloading
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && bids.length === 0 && !error && (
        <div className="glass-panel rounded-3xl p-10 text-center border-dashed border-gray-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Flame className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-gray-200">No Bids Yet!</h4>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm mx-auto">
            Be the very first website to claim the <strong className="text-amber-400">#1 position</strong> on the leaderboard for just $5.00.
          </p>
        </div>
      )}

      {/* Leaderboard list */}
      <div className="space-y-3">
        {bids.map((bid, index) => (
          <LeaderboardItem key={bid.id} bid={bid} rank={index + 1} />
        ))}
      </div>
    </div>
  );
}
