'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/Header';
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
    type: 'success' | 'failed' | 'canceled';
    message: string;
  } | null>(null);

  // Stable handlers to prevent component re-render loops
  const handleStatsUpdate = useCallback(
    (highestBidCents: number, totalBids: number, totalVolumeCents: number) => {
      setStats({
        count: totalBids,
        highest: highestBidCents,
        totalVolume: totalVolumeCents,
      });
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get('status')?.toLowerCase();
    const successParam = searchParams.get('success')?.toLowerCase();
    const canceledParam =
      searchParams.get('canceled')?.toLowerCase() || searchParams.get('cancelled')?.toLowerCase();

    // Check if the payment failed or was cancelled
    const isFailed =
      statusParam === 'failed' ||
      statusParam === 'cancelled' ||
      statusParam === 'canceled' ||
      canceledParam === 'true' ||
      successParam === 'false';

    // Success only if success=true OR status=succeeded AND definitely NOT failed
    const isSuccess =
      (successParam === 'true' ||
        statusParam === 'succeeded' ||
        statusParam === 'success' ||
        statusParam === 'completed') &&
      !isFailed;

    if (isSuccess) {
      setNotification({
        type: 'success',
        message: '🎉 Payment Successful! Your listing is now live on the OutBids attention market.',
      });
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    } else if (isFailed) {
      setNotification({
        type: 'failed',
        message: 'Payment could not be completed. Please try again.',
      });
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-on-surface selection:bg-primary selection:text-white">
      {/* 1. Sahara Sticky Editorial Header */}
      <Header
        isConnected={isConnected}
        totalBids={stats.count}
        highestBidCents={stats.highest}
        totalVolumeCents={stats.totalVolume}
      />

      {/* Banner for Checkout results */}
      {notification && (
        <div
          className={`w-full py-3 px-4 text-center text-sm font-semibold flex items-center justify-center gap-2 border-b animate-in slide-in-from-top duration-300 ${
            notification.type === 'success'
              ? 'bg-surface-container-highest text-emerald-800 border-emerald-500/40'
              : 'bg-error-container text-error border-error/30'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-error shrink-0" />
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

      {/* 2. Sahara Full-Width Hero Section */}
      <HeroBidding
        isConnected={isConnected}
        highestBidCents={stats.highest}
        totalBids={stats.count}
        totalVolumeCents={stats.totalVolume}
        selectedAmountDollars={selectedBidAmount}
      />

      {/* 3. Main Content: 2-Column Grid (Category Sidebar + Leaderboard Stream) */}
      <main className="flex-1 py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">
          {/* Left Category Sidebar */}
          <CategorySidebar
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            categoryCounts={categoryCounts}
            totalCount={stats.count}
          />

          {/* Right Main Leaderboard Feed */}
          <div className="flex-1 min-w-0 w-full">
            <Leaderboard
              selectedCategory={selectedCategory}
              onStatsUpdate={handleStatsUpdate}
              onConnectionChange={handleConnectionChange}
              onSelectBidAmount={handleSelectBidAmount}
            />
          </div>
        </div>
      </main>

      {/* 4. Sahara Editorial Rules Section */}
      <RulesGrid />

      {/* 5. Sahara Editorial Footer */}
      <Footer />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-text-muted text-sm bg-background font-serif">
          Loading attention market...
        </div>
      }
    >
      <MainContent />
    </Suspense>
  );
}
