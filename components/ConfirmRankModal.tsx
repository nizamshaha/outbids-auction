'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Globe, Shield, ExternalLink, Check } from 'lucide-react';
import Link from 'next/link';

interface ConfirmRankModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  normalizedUrl: string;
  displayDomain: string;
  faviconUrl?: string | null;
  category: string;
  bidAmount: number; // in dollars (e.g. 5)
  targetRank?: number; // e.g. 1
  listingId?: string;
  isTopUp?: boolean;
}

export function ConfirmRankModal({
  isOpen,
  onClose,
  url,
  normalizedUrl,
  displayDomain,
  faviconUrl,
  category,
  bidAmount,
  targetRank = 1,
  listingId,
  isTopUp = false,
}: ConfirmRankModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Reset agreement state on modal open
  useEffect(() => {
    if (isOpen) {
      setAgreed(false);
      setHasError(false);
      setApiError(null);
      setLoading(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    if (!agreed) {
      setHasError(true);
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: normalizedUrl || url,
          category,
          bidAmount,
          amountInDollars: bidAmount,
          targetRank,
          listingId,
        }),
      });

      let data: any = null;
      const responseText = await response.text();
      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }

      if (!response.ok) {
        const errorMsg =
          data?.error ||
          data?.message ||
          responseText ||
          `Payment session creation failed (${response.status})`;
        throw new Error(errorMsg);
      }

      const checkoutUrl = data?.checkout_url || data?.url;

      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL received from payment provider.');
      }
    } catch (err: unknown) {
      console.error('[ConfirmRankModal Error]:', err);
      const message =
        err instanceof Error
          ? err.message
          : typeof err === 'string'
          ? err
          : 'An unexpected error occurred while creating your checkout session.';
      setApiError(message);
      setLoading(false);
    }
  };

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(bidAmount);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-rank-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-start justify-between">
          <div>
            <h2
              id="confirm-rank-title"
              className="text-2xl font-black text-gray-950 tracking-tight"
            >
              Confirm this rank
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Check the rank and price, then agree to the Terms of Service to continue.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* API Error Alert */}
          {apiError && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Listing Summary Card */}
          <div className="p-4 rounded-xl bg-gray-50/80 border border-gray-200/80 space-y-3.5">
            {/* Target URL & Favicon */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                  {faviconUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={faviconUrl}
                      alt=""
                      className="w-5 h-5 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <div className="truncate">
                  <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Target Destination
                  </div>
                  <div className="text-sm font-bold text-gray-900 truncate">
                    {displayDomain || url}
                  </div>
                </div>
              </div>

              {/* Rank & Category Badges */}
              <div className="flex flex-col items-end shrink-0 gap-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black bg-[#FFF1F2] text-[#FF4B4B] border border-[#FFE4E6]">
                  #{targetRank}
                </span>
                <span className="text-[11px] font-semibold text-gray-500">
                  {category}
                </span>
              </div>
            </div>

            {/* Price & DUE NOW Tag */}
            <div className="pt-3 border-t border-gray-200/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-500">Total Price</span>
                <div className="text-2xl font-black text-gray-950 tracking-tight">
                  {formattedPrice}
                </div>
              </div>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                DUE NOW
              </span>
            </div>

            {/* Disclaimer Copy */}
            <div className="p-3 rounded-lg bg-white border border-gray-200/60 text-xs text-gray-600 leading-relaxed">
              A listing at that rank on the public board. It goes live when payment confirms. Someone else can outbid a higher rank.
            </div>
          </div>

          {/* Compliance Checkbox */}
          <div
            className={`p-3.5 rounded-xl border transition-colors ${
              hasError && !agreed
                ? 'border-red-400 bg-red-50/50'
                : 'border-gray-200 bg-gray-50/50'
            }`}
          >
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <div className="relative flex items-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => {
                    setAgreed(e.target.checked);
                    if (e.target.checked) setHasError(false);
                  }}
                  className="sr-only"
                />
                <div
                  className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                    agreed
                      ? 'bg-[#FF4B4B] border-[#FF4B4B] text-white'
                      : hasError
                      ? 'border-red-500 bg-white'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  {agreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
              <div className="text-xs sm:text-sm text-gray-700 font-medium leading-snug">
                <span>I have read and agree to the </span>
                <Link
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#FF4B4B] hover:underline inline-flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  Terms of Service of outbids.auction
                  <ExternalLink className="w-3 h-3 inline ml-0.5" />
                </Link>
              </div>
            </label>

            {/* Sub-links */}
            <div className="mt-2.5 pt-2 border-t border-gray-200/50 flex items-center gap-4 text-xs font-semibold text-gray-500 pl-8">
              <Link
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 hover:underline"
              >
                Privacy
              </Link>
              <span>•</span>
              <Link
                href="/rules"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 hover:underline"
              >
                Rules
              </Link>
              <span>•</span>
              <Link
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-900 hover:underline"
              >
                Terms
              </Link>
            </div>

            {/* Validation Message */}
            {hasError && !agreed && (
              <div className="mt-2 text-xs font-semibold text-red-600 pl-8 animate-in fade-in">
                Please accept the Terms of Service to continue to checkout.
              </div>
            )}
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="px-6 py-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-[#FF4B4B] hover:bg-[#E03E3E] text-white text-sm font-bold shadow-xs hover:shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Starting checkout...</span>
              </>
            ) : (
              <span>Continue to checkout</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
