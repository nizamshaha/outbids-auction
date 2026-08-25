'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Header } from '@/components/Header';
import { BidForm } from '@/components/BidForm';
import { Leaderboard } from '@/components/Leaderboard';
import { Footer } from '@/components/Footer';
import { CheckCircle2, XCircle, DollarSign, HelpCircle, Shield, Award, Zap, Flame, Globe } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

function MainContent() {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [stats, setStats] = useState({
    count: 0,
    highest: 0,
    totalVolume: 0,
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'canceled';
    message: string;
  } | null>(null);

  // Stable handlers to prevent component re-render loops
  const handleStatsUpdate = useCallback(
    (newStats: { count: number; highest: number; totalVolume: number }) => {
      setStats(newStats);
    },
    []
  );

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  useEffect(() => {
    const isSuccess = searchParams.get('success') === 'true';
    const isCanceled = searchParams.get('canceled') === 'true';

    if (isSuccess) {
      setNotification({
        type: 'success',
        message: '🎉 Payment Successful! Your bid is now live and broadcasted to the leaderboard.',
      });
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    } else if (isCanceled) {
      setNotification({
        type: 'canceled',
        message: 'Checkout was canceled. No charges were made.',
      });
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-[#08090d] text-gray-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Header */}
      <Navbar />

      {/* Banner for Checkout results */}
      {notification && (
        <div
          className={`w-full py-3 px-4 text-center text-sm font-semibold flex items-center justify-center gap-2 border-b animate-in slide-in-from-top duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{notification.message}</span>
          <button
            onClick={() => setNotification(null)}
            className="ml-3 text-xs underline opacity-75 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 max-w-4xl flex-1 flex flex-col items-center">
        {/* Hero Header */}
        <Header
          isConnected={isConnected}
          totalBids={stats.count}
          highestBidCents={stats.highest}
          totalVolumeCents={stats.totalVolume}
        />

        {/* Bid Form Section */}
        <div className="w-full mt-4 mb-8">
          <BidForm highestBidCents={stats.highest} />
        </div>

        {/* Realtime Leaderboard Section */}
        <div className="w-full mb-16">
          <Leaderboard
            onStatsUpdate={handleStatsUpdate}
            onConnectionChange={handleConnectionChange}
          />
        </div>

        {/* --- COMPLIANCE & EXPLANATION SECTIONS --- */}

        {/* Section 1: Business Model & How It Works */}
        <section id="how-it-works" className="w-full py-12 border-t border-gray-900">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
              <Flame className="w-3.5 h-3.5" />
              Digital Billboard Platform
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">How Outbids.auction Works</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              Outbids.auction is a real-time digital advertising billboard where creators, startups, and websites compete for prominent placement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-white">1. Submit Your Link</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter your website URL and select any bid starting at the minimum price of <strong>$5.00 USD</strong>.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-white">2. Secure Checkout</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Complete the purchase securely via <strong>Dodo Payments</strong> (Merchant of Record). All major credit cards, debit cards, and local methods accepted.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-white">3. Real-Time Rank Broadcast</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                The moment payment clears, our Supabase Realtime WebSocket engine broadcasts your link and updates all live visitors immediately.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Pricing & Rules */}
        <section id="pricing" className="w-full py-12 border-t border-gray-900">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              Transparent Pricing
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Pricing & Bidding Rules</h2>
            <p className="text-sm text-gray-400 mt-2 max-w-xl mx-auto">
              Simple, transparent, pay-as-you-bid digital advertising.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="glass-panel p-6 rounded-2xl space-y-4 border-indigo-500/30">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-white">Standard Entry Bid</h3>
                <span className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-extrabold text-sm">$5.00 USD</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Guaranteed slot on the live leaderboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Clickable do-follow external website link</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Instant real-time WebSocket broadcast</span>
                </li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-2xl space-y-4 border-amber-500/30 bg-amber-500/5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg text-amber-300">Top Rank Bids</h3>
                <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-sm">Dynamic</span>
              </div>
              <ul className="text-xs text-gray-300 space-y-2.5">
                <li className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>#1 Crown, #2 Silver, #3 Bronze special badge styling</span>
                </li>
                <li className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Maximum visibility at the top of the leaderboard</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Outbid button calculates exact amount to take #1</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: FAQ */}
        <section id="faq" className="w-full py-12 border-t border-gray-900 mb-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-700 mb-2">
              <HelpCircle className="w-3.5 h-3.5" />
              Frequently Asked Questions
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Questions & Answers</h2>
          </div>

          <div className="space-y-4 max-w-3xl mx-auto text-sm">
            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">What happens when someone outbids me?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When another user places a higher bid, their website moves above yours, and your link moves to the next ranking spot down. Your link remains permanently on the leaderboard in its relative position.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">Who handles billing and payment security?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                All transactions are processed by our Merchant of Record, <strong>Dodo Payments</strong>. We do not store or touch your card details, and all purchases are backed by 256-bit encryption.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">What is the refund policy?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Due to the immediate digital nature and live broadcast of the leaderboard, bids are final once processed. Please review our <Link href="/refund" className="text-indigo-400 underline">Refund Policy</Link> for full details.
              </p>
            </div>

            <div className="glass-panel p-5 rounded-2xl space-y-2">
              <h4 className="font-bold text-white">How can I contact support?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                You can reach our team anytime at <a href="mailto:support@outbids.auction" className="text-indigo-400 underline">support@outbids.auction</a> or visit our <Link href="/contact" className="text-indigo-400 underline">Contact Page</Link>.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Global Compliance Footer */}
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">
          Loading leaderboard...
        </div>
      }
    >
      <MainContent />
    </Suspense>
  );
}
