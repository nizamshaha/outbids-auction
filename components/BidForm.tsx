'use client';

import React, { useState } from 'react';
import { sanitizeAndNormalizeUrl, getFaviconUrl, formatCentsToDollars } from '@/utils/formatters';
import { ArrowRight, Loader2, Sparkles, AlertCircle, Link as LinkIcon, DollarSign, Zap } from 'lucide-react';

interface BidFormProps {
  highestBidCents: number;
  onBidSubmitted?: () => void;
}

const MIN_BID_DOLLARS = 5;

export function BidForm({ highestBidCents }: BidFormProps) {
  const [url, setUrl] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Live URL validation and preview
  const urlValidation = sanitizeAndNormalizeUrl(url);
  const previewDomain = urlValidation.isValid ? urlValidation.displayDomain : null;
  const previewFavicon = urlValidation.isValid ? getFaviconUrl(urlValidation.normalizedUrl) : null;

  // Calculate recommended bid to beat #1
  const highestBidDollars = highestBidCents > 0 ? highestBidCents / 100 : 0;
  const outbidTopAmount = Math.max(MIN_BID_DOLLARS, Math.ceil(highestBidDollars + 1));

  const handleQuickAdd = (addedDollars: number) => {
    const current = parseFloat(amount) || (highestBidDollars > 0 ? highestBidDollars : 0);
    const nextAmount = Math.max(MIN_BID_DOLLARS, Math.round(current + addedDollars));
    setAmount(nextAmount.toString());
    setErrorMessage(null);
  };

  const handleSetOutbidTop = () => {
    setAmount(outbidTopAmount.toString());
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate URL
    if (!url.trim()) {
      setErrorMessage('Please enter a website URL.');
      return;
    }

    if (!urlValidation.isValid) {
      setErrorMessage(urlValidation.error || 'Please enter a valid website URL.');
      return;
    }

    // Validate Amount
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < MIN_BID_DOLLARS) {
      setErrorMessage(`Minimum bid is $${MIN_BID_DOLLARS}.00 USD.`);
      return;
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
          amountInDollars: parsedAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to initialize checkout.');
      }

      if (data.url) {
        // Redirect user to Stripe Checkout
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
    <div className="w-full max-w-xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
      {/* Decorative top accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Place Your Bid
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Claim your position on the global live leaderboard.
          </p>
        </div>
        <div className="text-right">
          <span className="text-[11px] uppercase tracking-wider text-gray-400 block font-semibold">Min Bid</span>
          <span className="text-emerald-400 font-bold text-sm">${MIN_BID_DOLLARS}.00</span>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 text-red-300 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300 mb-2">
            Website URL
          </label>
          <div className="relative">
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
              placeholder="https://yourwebsite.com"
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          {/* Live URL Preview Pill */}
          {previewDomain && (
            <div className="mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-900/90 border border-gray-800 text-xs text-gray-300 animate-in fade-in">
              {previewFavicon && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewFavicon}
                  alt=""
                  className="w-4 h-4 object-contain rounded"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              )}
              <span className="text-gray-400">Target:</span>
              <span className="font-semibold text-indigo-300 truncate">{previewDomain}</span>
            </div>
          )}
        </div>

        {/* Bid Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-300">
              Bid Amount (USD $)
            </label>
            {highestBidDollars > 0 && (
              <span className="text-[11px] text-gray-400">
                Current #1: <strong className="text-amber-400">{formatCentsToDollars(highestBidCents)}</strong>
              </span>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
              <DollarSign className="w-4 h-4" />
            </div>
            <input
              type="number"
              min={MIN_BID_DOLLARS}
              step="1"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMessage(null);
              }}
              placeholder={`Min ${MIN_BID_DOLLARS}`}
              disabled={loading}
              className="w-full pl-10 pr-4 py-3 bg-gray-950/60 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-2 mt-2.5">
            {highestBidDollars > 0 && (
              <button
                type="button"
                onClick={handleSetOutbidTop}
                disabled={loading}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-colors flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-400" />
                Take #1 (${outbidTopAmount})
              </button>
            )}
            <button
              type="button"
              onClick={() => handleQuickAdd(5)}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800/80 border border-gray-700/60 text-gray-300 hover:bg-gray-700/80 transition-colors"
            >
              +$5
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(10)}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800/80 border border-gray-700/60 text-gray-300 hover:bg-gray-700/80 transition-colors"
            >
              +$10
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd(25)}
              disabled={loading}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-gray-800/80 border border-gray-700/60 text-gray-300 hover:bg-gray-700/80 transition-colors"
            >
              +$25
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:via-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Redirecting to Dodo Payments...</span>
            </>
          ) : (
            <>
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-gray-500 mt-2">
          Payments processed securely via Dodo Payments. Your bid will appear instantly upon verification.
        </p>
      </form>
    </div>
  );
}
