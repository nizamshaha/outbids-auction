'use client';

import React, { useState, useEffect } from 'react';
import { sanitizeAndNormalizeUrl, getFaviconUrl, formatCentsToDollars } from '@/utils/formatters';
import { BidCategory, PLATFORM_CATEGORIES } from '@/types/bid';
import { ArrowRight, Loader2, AlertCircle, Link as LinkIcon, DollarSign, Zap, Tag, Sparkles, CheckCircle2, Gift } from 'lucide-react';

interface HeroBiddingProps {
  highestBidCents: number;
  totalBids: number;
  totalVolumeCents: number;
  isConnected: boolean;
  selectedAmountDollars?: number | null;
}

const MIN_BID_DOLLARS = 1;

export function HeroBidding({
  highestBidCents,
  totalBids,
  totalVolumeCents,
  isConnected,
  selectedAmountDollars,
}: HeroBiddingProps) {
  const [url, setUrl] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<BidCategory>('AI');
  const [isFreeMode, setIsFreeMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Calculate dynamic claim price for #1: Highest + $1 (or $1 if 0)
  const highestBidDollars = highestBidCents > 0 ? highestBidCents / 100 : 0;
  const claimTopDollars = highestBidDollars > 0 ? Math.ceil(highestBidDollars + 1) : MIN_BID_DOLLARS;

  // Sync selected amount from podium clicks if provided
  useEffect(() => {
    if (selectedAmountDollars && selectedAmountDollars >= MIN_BID_DOLLARS) {
      setAmount(selectedAmountDollars.toString());
      setIsFreeMode(false);
    }
  }, [selectedAmountDollars]);

  // Live URL validation and preview
  const urlValidation = sanitizeAndNormalizeUrl(url);
  const previewDomain = urlValidation.isValid ? urlValidation.displayDomain : null;
  const previewFavicon = urlValidation.isValid ? getFaviconUrl(urlValidation.normalizedUrl) : null;

  const handleQuickAdd = (addedDollars: number) => {
    setIsFreeMode(false);
    const current = parseFloat(amount) || (highestBidDollars > 0 ? highestBidDollars : 0);
    const nextAmount = Math.max(MIN_BID_DOLLARS, Math.round(current + addedDollars));
    setAmount(nextAmount.toString());
    setErrorMessage(null);
  };

  const handleSetClaimTop = () => {
    setIsFreeMode(false);
    setAmount(claimTopDollars.toString());
    setErrorMessage(null);
  };

  const handleToggleFree = () => {
    if (!isFreeMode) {
      setIsFreeMode(true);
      setAmount('0');
    } else {
      setIsFreeMode(false);
      setAmount(MIN_BID_DOLLARS.toString());
    }
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate URL
    if (!url.trim()) {
      setErrorMessage('Please enter a website URL.');
      return;
    }

    if (!urlValidation.isValid) {
      setErrorMessage(urlValidation.error || 'Please enter a valid website URL.');
      return;
    }

    const parsedAmount = parseFloat(amount);

    if (!isFreeMode) {
      if (isNaN(parsedAmount) || parsedAmount < MIN_BID_DOLLARS) {
        setErrorMessage(`Minimum paid bid is $${MIN_BID_DOLLARS}.00 USD.`);
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: urlValidation.normalizedUrl,
          amountInDollars: isFreeMode ? 0 : parsedAmount,
          category,
          isFreeTier: isFreeMode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout.');
      }

      if (data.provider === 'free') {
        setSuccessMessage(data.message || '🎉 Free listing successfully added to the leaderboard!');
        setUrl('');
        setAmount('');
        setIsFreeMode(false);
        setLoading(false);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from server.');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <section className="w-full pt-8 pb-4 flex flex-col items-center text-center">
      {/* Live Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-gray-900/90 border border-gray-800 backdrop-blur-md shadow-inner mb-6">
        <span className="relative flex h-2.5 w-2.5">
          {isConnected ? (
            <>
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </>
          ) : (
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          )}
        </span>
        <span className={isConnected ? "text-emerald-400 font-bold tracking-wider text-[11px]" : "text-amber-400 font-bold tracking-wider text-[11px]"}>
          {isConnected ? 'LIVE 24/7' : 'CONNECTING...'}
        </span>
      </div>

      {/* Dynamic Hero Title */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-3 max-w-3xl">
        Claim <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">#1</span> for{' '}
        <span className="text-emerald-400 underline decoration-emerald-500/50 decoration-wavy decoration-2">
          ${claimTopDollars}
        </span>
      </h1>

      {/* Subtitle */}
      <p className="max-w-xl text-sm sm:text-base text-gray-400 mb-8">
        Outbid the competition to broadcast your website link on the global live digital billboard.
      </p>

      {/* Compact Inline Bidding Form */}
      <div className="w-full max-w-2xl mx-auto glass-panel p-4 sm:p-6 rounded-3xl shadow-2xl relative border-gray-800 bg-gray-950/80 backdrop-blur-2xl">
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs text-left animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5 text-emerald-300 text-xs text-left animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* Website URL Input */}
            <div className="sm:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Your product URL or @handle"
                disabled={loading}
                className="w-full pl-10 pr-3 py-3 bg-gray-900/90 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all disabled:opacity-50"
              />
            </div>

            {/* Category Dropdown */}
            <div className="sm:col-span-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BidCategory)}
                disabled={loading}
                aria-label="Website Category"
                className="w-full pl-8 pr-3 py-3 bg-gray-900/90 border border-gray-800 rounded-xl text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all cursor-pointer"
              >
                {PLATFORM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-gray-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Bid Amount Input */}
            <div className="sm:col-span-3 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min={isFreeMode ? 0 : MIN_BID_DOLLARS}
                step="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMessage(null);
                  if (parseFloat(e.target.value) > 0) {
                    setIsFreeMode(false);
                  }
                }}
                placeholder={isFreeMode ? 'Free ($0)' : `Min $${MIN_BID_DOLLARS}`}
                disabled={loading || isFreeMode}
                className={`w-full pl-8 pr-3 py-3 bg-gray-900/90 border rounded-xl text-white placeholder-gray-500 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 transition-all ${
                  isFreeMode ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/5' : 'border-gray-800'
                }`}
              />
            </div>
          </div>

          {/* Live URL Preview Pill with Scraper Indicator */}
          {previewDomain && (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gray-900/90 border border-gray-800 text-xs text-left animate-in fade-in">
              <div className="flex items-center gap-2 truncate">
                {previewFavicon && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={previewFavicon}
                    alt=""
                    className="w-4 h-4 object-contain rounded shrink-0"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                )}
                <span className="text-gray-400">Target:</span>
                <span className="font-semibold text-orange-400 truncate">{previewDomain}</span>
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                Auto-scrapes Title & Icon
              </span>
            </div>
          )}

          {/* Quick Increment Suggestions & CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSetClaimTop}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-300 hover:bg-orange-500/25 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Zap className="w-3 h-3 text-orange-400" />
                Take #1 (${claimTopDollars})
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(1)}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-850 border border-gray-800 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                +$1
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(5)}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-850 border border-gray-800 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                +$5
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(10)}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-850 border border-gray-800 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                +$10
              </button>
              <button
                type="button"
                onClick={() => handleQuickAdd(25)}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-850 border border-gray-800 text-gray-300 hover:bg-gray-800 transition-colors cursor-pointer"
              >
                +$25
              </button>
              <button
                type="button"
                onClick={handleToggleFree}
                disabled={loading}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                  isFreeMode
                    ? 'bg-emerald-500/25 border border-emerald-400/60 text-emerald-300'
                    : 'bg-gray-850 border border-gray-800 text-emerald-400/80 hover:bg-gray-800'
                }`}
              >
                <Gift className="w-3 h-3 text-emerald-400" />
                Free ($0)
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-extrabold text-sm shadow-lg flex items-center justify-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer ${
                isFreeMode
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-black shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-500'
                  : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-black shadow-orange-500/25'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Processing...</span>
                </>
              ) : isFreeMode ? (
                <>
                  <span>Submit Free Listing</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Outbid ⚡</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Real-Time Metrics Bar */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 max-w-lg w-full mt-8 p-3.5 rounded-2xl bg-gray-950/70 border border-gray-800/80 backdrop-blur-xl text-center">
        <div className="space-y-0.5">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Total Live Bids
          </span>
          <span className="text-sm sm:text-lg font-black text-white">
            {totalBids}
          </span>
        </div>

        <div className="space-y-0.5 border-l border-gray-800 pl-2">
          <span className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Status
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            LIVE 24/7
          </span>
        </div>
      </div>
    </section>
  );
}
