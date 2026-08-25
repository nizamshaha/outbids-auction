'use client';

import React from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface LiveBadgeProps {
  isConnected: boolean;
  statusText?: string;
}

export function LiveBadge({ isConnected, statusText }: LiveBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gray-900/80 border border-gray-800 backdrop-blur-md shadow-inner">
      <span className="relative flex h-2 w-2">
        {isConnected ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        )}
      </span>
      <span className={isConnected ? "text-emerald-400 font-semibold tracking-wider uppercase text-[11px]" : "text-amber-400 font-semibold tracking-wider uppercase text-[11px]"}>
        {statusText || (isConnected ? 'Real-Time Active' : 'Connecting')}
      </span>
      {isConnected ? (
        <Wifi className="w-3 h-3 text-emerald-400/80" />
      ) : (
        <WifiOff className="w-3 h-3 text-amber-400/80" />
      )}
    </div>
  );
}
