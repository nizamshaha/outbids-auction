'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { formatCentsToDollars } from '@/utils/formatters';
import { Zap, Activity } from 'lucide-react';

interface LiveStatsProps {
  totalVolumeCents?: number;
}

export function LiveStats({ totalVolumeCents }: LiveStatsProps) {
  const [activeViewers, setActiveViewers] = useState<number>(1);
  const [volumeCents, setVolumeCents] = useState<number>(totalVolumeCents || 0);

  // Sync with prop when external state updates from realtime bids
  useEffect(() => {
    if (typeof totalVolumeCents === 'number' && totalVolumeCents > 0) {
      setVolumeCents(totalVolumeCents);
    }
  }, [totalVolumeCents]);

  // Initial Supabase query to sum all successful bid amounts across the platform
  useEffect(() => {
    let isMounted = true;

    async function fetchPlatformTotalVolume() {
      try {
        const { data, error } = await supabase
          .from('bids')
          .select('amount')
          .eq('status', 'paid');

        if (!error && data && isMounted) {
          const sum = data.reduce((acc, row) => acc + (row.amount || 0), 0);
          setVolumeCents((prev) => Math.max(prev, sum));
        }
      } catch (err) {
        console.error('[LiveStats] Error fetching total volume:', err);
      }
    }

    fetchPlatformTotalVolume();

    return () => {
      isMounted = false;
    };
  }, []);

  // Supabase Realtime Presence to track active WebSocket connections
  useEffect(() => {
    let channel: any = null;

    const setupPresence = async () => {
      try {
        const presenceId =
          typeof window !== 'undefined'
            ? sessionStorage.getItem('outbids_presence_id') ||
              (() => {
                const id = 'viewer_' + Math.random().toString(36).substring(2, 9);
                try {
                  sessionStorage.setItem('outbids_presence_id', id);
                } catch {}
                return id;
              })()
            : 'viewer_anon';

        channel = supabase.channel('outbids-live-viewers', {
          config: {
            presence: {
              key: presenceId,
            },
          },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const count = Object.keys(state).length;
            setActiveViewers(Math.max(1, count));
          })
          .on('presence', { event: 'join' }, () => {
            const state = channel.presenceState();
            const count = Object.keys(state).length;
            setActiveViewers(Math.max(1, count));
          })
          .on('presence', { event: 'leave' }, () => {
            const state = channel.presenceState();
            const count = Object.keys(state).length;
            setActiveViewers(Math.max(1, count));
          })
          .subscribe(async (status: string) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({
                online_at: new Date().toISOString(),
              });
            }
          });
      } catch (err) {
        console.error('[LiveStats] Presence tracking error:', err);
      }
    };

    setupPresence();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const formattedVolume =
    volumeCents > 0 ? formatCentsToDollars(volumeCents) : '$0';

  return (
    <div className="w-full bg-[#FFFBF8] border-b border-[#F5EBE1] py-2 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        {/* Left: Active Viewers with Pulsating Green Dot */}
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-bold text-gray-800 tracking-tight flex items-center gap-1.5">
            <span className="tabular-nums font-mono font-black text-gray-900">
              {activeViewers}
            </span>
            <span className="text-gray-600 font-medium">Active Now</span>
          </span>
          <span className="hidden sm:inline text-gray-300">•</span>
          <span className="hidden sm:inline text-[11px] text-gray-500 font-medium">
            Live WebSocket Sync
          </span>
        </div>

        {/* Right: Total Platform Volume */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto sm:ml-0">
          <span className="text-gray-500 text-xs hidden md:inline">
            Platform Total Volume:
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#FFE4E0] shadow-2xs">
            <Zap className="w-3 h-3 text-[#FF4B4B] fill-[#FF4B4B]" />
            <span className="text-[11px] uppercase font-bold tracking-wider text-gray-500">
              Volume
            </span>
            <span className="font-mono font-black text-[#FF4B4B] text-sm tabular-nums">
              {formattedVolume}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
