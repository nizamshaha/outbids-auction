'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Globe, ArrowUpRight, Radio } from 'lucide-react';
import { formatCentsToDollars } from '@/utils/formatters';

interface HeaderProps {
  isConnected: boolean;
  totalBids: number;
  highestBidCents: number;
  totalVolumeCents: number;
}

export function Header({
  isConnected,
  totalBids,
  highestBidCents,
  totalVolumeCents,
}: HeaderProps) {
  return (
    <header className="border-b border-outline-variant sticky top-0 bg-surface/90 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm">
        {/* Brand & Nav */}
        <div className="flex items-center gap-8">
          <Link href="/" className="font-bold text-xl flex items-center gap-2 font-display">
            <span className="text-primary tracking-tight">OutBids.auction</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-text-muted text-xs uppercase tracking-widest font-semibold">
            <Link href="/" className="text-text-main font-bold hover:text-primary transition-colors">
              All-time
            </Link>
            <a href="#rules" className="hover:text-text-main transition-colors">
              Rules
            </a>
            <Link href="/contact" className="hover:text-text-main transition-colors">
              Support
            </Link>
          </nav>
        </div>

        {/* Live Metrics & Quick Links */}
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-4 text-xs text-text-muted">
            <span className="flex items-center gap-1.5 font-medium">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'}`} />
              {isConnected ? 'LIVE 24/7' : 'Connecting...'}
            </span>
            <span className="text-outline-variant">|</span>
            <span className="font-semibold text-text-main">{totalBids} live listings</span>
            <span className="text-outline-variant">|</span>
            <span className="uppercase tracking-widest text-[10px] text-primary font-bold">
              PUBLIC BOARD
            </span>
          </div>

          <nav className="flex gap-4 font-semibold text-xs uppercase tracking-wider">
            <a
              href="#rules"
              className="px-3.5 py-1.5 rounded-lg border border-outline-variant hover:bg-surface-container transition-colors text-text-muted hover:text-primary"
            >
              How it works
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
