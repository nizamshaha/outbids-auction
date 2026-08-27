'use client';

import React, { useState, useEffect } from 'react';
import { sanitizeAndNormalizeUrl, getFaviconUrl, formatCentsToDollars } from '@/utils/formatters';
import { BidCategory, PLATFORM_CATEGORIES } from '@/types/bid';
import { ArrowRight, Loader2, AlertCircle, Sparkles, CheckCircle2, Zap, Gift, Tag, Link as LinkIcon, DollarSign } from 'lucide-react';

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
  const [category, setCategory] = useState<BidCategory>('SEO & AI Visibility');
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
      setErrorMessage('Please enter a website URL or @handle.');
      return;
    }

    if (!urlValidation.isValid) {
      setErrorMessage(urlValidation.error || 'Please enter a valid website URL or @handle.');
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize bidding checkout.');
      }

      // If Free tier submission completed immediately
      if (data.provider === 'free') {
        setSuccessMessage(data.message || '🎉 Your listing is now live on Outbids.auction!');
        setUrl('');
        setAmount('');
        setIsFreeMode(false);
        return;
      }

      // If payment redirect URL returned (Dodo Payments)
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received from payment provider.');
      }
    } catch (err: any) {
      console.error('[HeroBidding Error]:', err);
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-16 md:py-20 border-b border-outline-variant text-center px-4 bg-surface-container-low">
      <div className="max-w-4xl mx-auto">
        {/* Sahara Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 font-display text-on-surface tracking-tight">
          Claim <span className="text-red-500 font-display">#1</span> for <span className="text-primary font-display">${claimTopDollars}</span> +
        </h1>

        {/* Sahara Editorial Subtitle */}
        <p className="text-text-muted max-w-xl mx-auto mb-8 text-sm sm:text-base leading-relaxed">
          New spots start at $1. Paying less than the #1 price still puts you on the board at whatever place that bid can take.
        </p>

        {/* Error / Success Feedback Banners */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-error-container border border-error/30 flex items-start gap-3 text-error text-xs sm:text-sm text-left max-w-2xl mx-auto shadow-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-error shrink-0 mt-0.5" />
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 rounded-xl bg-surface-container-highest border border-emerald-500/40 flex items-start gap-3 text-emerald-800 text-xs sm:text-sm text-left max-w-2xl mx-auto shadow-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="font-semibold">{successMessage}</span>
          </div>
        )}

        {/* Sahara Bidding Form */}
        <form noValidate onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* URL / @handle Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline font-semibold">
                @
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
                className="w-full pl-10 pr-4 py-4 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm sm:text-base text-on-surface placeholder:text-on-surface-variant transition-all shadow-sm disabled:opacity-50"
              />
            </div>

            {/* Category Dropdown */}
            <div className="w-full sm:w-48 relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as BidCategory)}
                disabled={loading}
                className="w-full px-4 py-4 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-on-surface appearance-none shadow-sm cursor-pointer disabled:opacity-50 font-semibold"
              >
                {PLATFORM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-surface text-on-surface">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-outline text-xs">
                ▼
              </div>
            </div>

            {/* Amount Input */}
            <div className="w-full sm:w-36 relative">
              <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-outline">
                <DollarSign className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setErrorMessage(null);
                  if (parseFloat(e.target.value) > 0) {
                    setIsFreeMode(false);
                  }
                }}
                placeholder={isFreeMode ? 'Free ($0)' : 'Min $1'}
                disabled={loading || isFreeMode}
                className={`w-full pl-8 pr-3 py-4 rounded-xl border border-outline-variant bg-surface focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm sm:text-base text-on-surface font-bold transition-all shadow-sm ${
                  isFreeMode ? 'bg-surface-container text-emerald-800 font-semibold' : ''
                }`}
              />
            </div>

            {/* Outbid CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className={`px-8 py-4 rounded-xl font-bold text-base transition-all shadow-sm whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer ${
                isFreeMode
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : 'bg-primary hover:bg-primary-container text-white hover:text-white'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : isFreeMode ? (
                <>
                  <span>Submit Free</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Outbid ⚡</span>
                </>
              )}
            </button>
          </div>

          {/* Live URL Preview Pill with Scraper Indicator */}
          {previewDomain && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface border border-outline-variant text-xs text-left animate-in fade-in shadow-sm">
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
                <span className="text-text-muted">Target:</span>
                <span className="font-bold text-primary truncate">{previewDomain}</span>
              </div>
              <span className="text-[11px] text-text-muted shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-primary" />
                Auto-scrapes Title & Favicon
              </span>
            </div>
          )}

          {/* Quick Increment Suggestions & Free Tier */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSetClaimTop}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary-fixed text-on-primary-fixed border border-primary/20 hover:bg-primary-fixed-dim transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-primary" />
              Take #1 (${claimTopDollars})
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(1)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-outline-variant text-text-main hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              +$1
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(5)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-outline-variant text-text-main hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              +$5
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(10)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-outline-variant text-text-main hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              +$10
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(25)}
              disabled={loading}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-outline-variant text-text-main hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              +$25
            </button>
            <button
              type="button"
              onClick={handleToggleFree}
              disabled={loading}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isFreeMode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-surface border border-outline-variant text-emerald-700 hover:bg-surface-container-high'
              }`}
            >
              <Gift className="w-3 h-3 text-emerald-600" />
              Free ($0)
            </button>
          </div>
        </form>

        {/* Consumer Disclosure Notice & Compliance Disclaimer */}
        <p className="mt-4 text-[11px] text-text-muted/80 max-w-2xl mx-auto leading-normal text-center italic">
          Rank represents a changing, competitive display order on this public board and does not constitute a guarantee of traffic, sales, search ranking, or endorsement.
        </p>

        {/* Feature & Platform badges */}
        <div className="mt-6 text-xs text-text-muted flex flex-wrap items-center justify-center gap-4">
          <span>Websites, X, Instagram, App Store and Google Play links supported.</span>
          <span className="flex gap-1.5">
            <span className="px-2 py-0.5 rounded border border-outline-variant bg-surface text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Live Broadcast
            </span>
            <span className="px-2 py-0.5 rounded border border-outline-variant bg-surface text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
              Free Tier
            </span>
            <span className="px-2 py-0.5 rounded border border-outline-variant bg-surface text-[11px] font-semibold uppercase tracking-wider text-primary">
              Paid Billboard
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
