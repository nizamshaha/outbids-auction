import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RulesGrid } from '@/components/RulesGrid';
import { ShieldCheck, Scale } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Platform Rules & Mechanics | Outbids.auction',
  description: 'Understand the simple rules, bidding mechanics, top-ups, and verified digital visibility ranking on Outbids.auction.',
};

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar showBackHome />

      <main className="max-w-5xl mx-auto px-4 py-12 flex-1 w-full space-y-12">
        <div className="text-center sm:text-left border-b border-outline-variant pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-primary border border-outline-variant mb-3">
            <Scale className="w-3.5 h-3.5" />
            Public Market Integrity
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-on-surface tracking-tight">
            Rules & Auction Mechanics
          </h1>
          <p className="text-base text-text-muted mt-2 max-w-2xl leading-relaxed">
            OutBids.auction operates on transparent, mathematical rankings. Learn how bids, top-ups, tie-breakers, and traffic verification work.
          </p>
        </div>

        {/* 4 Core Rules Section */}
        <RulesGrid />

        {/* Consumer & Digital Advertising Disclosure */}
        <div className="p-7 rounded-2xl bg-surface border border-outline-variant shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-primary font-display font-bold text-lg">
            <ShieldCheck className="w-5 h-5" />
            <h3>Consumer Disclosure & Digital Advertising Notice</h3>
          </div>
          <p className="text-sm text-text-muted leading-relaxed">
            Rank represents a changing, competitive display order on this public board and does not constitute a guarantee of traffic, sales, search ranking, or endorsement. Listings are displayed strictly in accordance with verified bid amounts.
          </p>
          <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-primary">
            <Link href="/terms" className="hover:underline">
              Terms of Service →
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy →
            </Link>
            <Link href="/refund-policy" className="hover:underline">
              Refund Policy →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
