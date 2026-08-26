'use client';

import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function MidnightCountdown() {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    function calculateTimeUntilMidnightUTC() {
      const now = new Date();
      const nextMidnightUTC = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() + 1,
          0,
          0,
          0,
          0
        )
      );

      const diffMs = nextMidnightUTC.getTime() - now.getTime();
      const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      return { hours, minutes, seconds };
    }

    setTimeLeft(calculateTimeUntilMidnightUTC());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeUntilMidnightUTC());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!timeLeft) return null;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-300 text-xs font-bold font-mono tracking-wide shadow-inner animate-in fade-in">
      <Clock className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
      <span>
        Resets in {pad(timeLeft.hours)}h {pad(timeLeft.minutes)}m {pad(timeLeft.seconds)}s UTC
      </span>
    </div>
  );
}
