'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { HeroBidding } from '@/components/HeroBidding';
import { Leaderboard } from '@/components/Leaderboard';
import { CategorySidebar } from '@/components/CategorySidebar';
import { RulesGrid } from '@/components/RulesGrid';
import { Footer } from '@/components/Footer';
import { CheckCircle2, XCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

function MainContent() {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedBidAmount, setSelectedBidAmount] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
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

  const handleCategoryCounts = useCallback(
    (counts: Record<string, number>) => {
      setCategoryCounts(counts);
    },
    []
  );

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
  }, []);

  const handleSelectBidAmount = useCallback((amountDollars: number) => {
    setSelectedBidAmount(amountDollars);
    // Smooth scroll to top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="flex flex-col min-h-screen bg-[#08090d] text-gray-100 selection:bg-orange-500 selection:text-white">
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
            className="ml-3 text-xs underline opacity-75 hover:opacity-100 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <main className="container mx-auto px-4 max-w-6xl flex-1 flex flex-col items-center pb-16">
        {/* 1. Hero & Dynamic Bidding Header + Real-Time Metrics Bar */}
        <HeroBidding
          isConnected={isConnected}
          highestBidCents={stats.highest}
          totalBids={stats.count}
          totalVolumeCents={stats.totalVolume}
          selectedAmountDollars={selectedBidAmount}
        />

        {/* 2. Main Two-Column Layout (Left Category Sidebar + Right Leaderboard) */}
        <div className="w-full flex flex-col lg:flex-row gap-8 items-start mt-8">
          {/* Left Category Sidebar (Desktop Pinned Aside + Mobile Rail) */}
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            totalCount={stats.count}
          />

          {/* Right Main Leaderboard Stream & Rules */}
          <div className="flex-1 min-w-0 w-full space-y-12">
            <Leaderboard
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onStatsUpdate={handleStatsUpdate}
              onConnectionChange={handleConnectionChange}
              onSelectBidAmount={handleSelectBidAmount}
              onCategoryCountsCalculated={handleCategoryCounts}
            />

            {/* "Simple Rules" 6-Card Grid */}
            <RulesGrid />
          </div>
        </div>
      </main>

      {/* 3. Legal & Compliance Footer */}
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm bg-[#08090d]">
          Loading leaderboard...
        </div>
      }
    >
      <MainContent />
    </Suspense>
  );
}
