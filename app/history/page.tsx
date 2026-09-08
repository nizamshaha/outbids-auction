'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/utils/supabase/client';
import { Bid } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  History,
  Mail,
  Search,
  ExternalLink,
  Zap,
  MousePointerClick,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function PaymentHistoryPage() {
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailInput, setEmailInput] = useState('');
  const [searchedEmail, setSearchedEmail] = useState<string | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Check if authenticated user session exists in Supabase
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.email) {
          setCurrentUserEmail(user.email);
          setEmailInput(user.email);
          setSearchedEmail(user.email);
        }
      } catch (err) {
        console.warn('[History Auth Check]:', err);
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Fetch bids matching the target email
  const fetchBidsForEmail = useCallback(async (email: string) => {
    if (!email || !email.trim()) return;
    const cleanEmail = email.trim().toLowerCase();
    setLoadingBids(true);
    setErrorMessage(null);

    try {
      // Query bids by email column
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('email', cleanEmail)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setBids((data as Bid[]) || []);
    } catch (err: any) {
      console.error('[History Fetch Error]:', err);
      setErrorMessage(err.message || 'Failed to retrieve payment history.');
    } finally {
      setLoadingBids(false);
    }
  }, []);

  // Trigger query whenever searchedEmail changes
  useEffect(() => {
    if (searchedEmail) {
      fetchBidsForEmail(searchedEmail);
    }
  }, [searchedEmail, fetchBidsForEmail]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSearchedEmail(emailInput.trim());
  };

  const totalVolumeCents = bids.reduce((acc, b) => (b.status === 'paid' ? acc + b.amount : acc), 0);
  const totalClicks = bids.reduce((acc, b) => acc + (b.click_count || 0), 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] selection:bg-[#c2652a] selection:text-white">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 md:py-14">
        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f2ece4] text-[#3a302a] text-xs font-bold border border-[#d8d0c8] mb-3">
            <History className="w-3.5 h-3.5 text-[#c2652a]" />
            <span>Unified Payment History</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-display tracking-tight text-[#1a1a1a]">
            Your Bids & Placements
          </h1>
          <p className="text-sm text-[#605850] mt-1.5 max-w-2xl leading-relaxed">
            Look up all paid bids and free tier listings associated with your checkout email. Past guest checkouts automatically reconcile once queried with the matching email.
          </p>
        </div>

        {/* Search / Email Input Form */}
        <div className="bg-white rounded-2xl border border-[#d8d0c8] p-6 mb-8 shadow-xs">
          <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 text-[#605850] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter your Dodo Payments checkout email (e.g. founder@domain.com)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#d8d0c8] bg-[#faf5ee] text-sm text-[#1a1a1a] placeholder-[#605850]/70 focus:outline-none focus:border-[#c2652a] focus:ring-1 focus:ring-[#c2652a]"
              />
            </div>
            <button
              type="submit"
              disabled={loadingBids}
              className="px-6 py-2.5 rounded-xl bg-[#c2652a] hover:bg-[#a8521d] text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-50"
            >
              {loadingBids ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Looking up...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Find My Listings</span>
                </>
              )}
            </button>
          </form>

          {currentUserEmail && (
            <p className="text-xs text-emerald-800 mt-3 flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Signed in as <strong>{currentUserEmail}</strong></span>
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm font-medium flex items-center gap-2 mb-6">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Results Section */}
        {searchedEmail && !loadingBids && (
          <div className="space-y-6">
            {/* Stats Summary Strip */}
            {bids.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white border border-[#d8d0c8] shadow-xs">
                  <span className="text-xs font-bold text-[#605850] uppercase tracking-wider block">
                    Total Listings
                  </span>
                  <span className="text-2xl font-black text-[#1a1a1a] mt-1 block">
                    {bids.length}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#d8d0c8] shadow-xs">
                  <span className="text-xs font-bold text-[#605850] uppercase tracking-wider block">
                    Total Volume Locked
                  </span>
                  <span className="text-2xl font-black text-[#c2652a] mt-1 block font-display">
                    {formatCentsToDollars(totalVolumeCents)}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white border border-[#d8d0c8] shadow-xs">
                  <span className="text-xs font-bold text-[#605850] uppercase tracking-wider block">
                    Total Traffic Generated
                  </span>
                  <span className="text-2xl font-black text-[#1a1a1a] mt-1 block">
                    {totalClicks.toLocaleString()} clicks
                  </span>
                </div>
              </div>
            )}

            {/* List of Bids */}
            {bids.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white rounded-2xl border border-[#d8d0c8]">
                <Clock className="w-10 h-10 text-[#605850]/50 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#1a1a1a]">No listings found</h3>
                <p className="text-xs text-[#605850] max-w-sm mx-auto mt-1">
                  We could not find any bids associated with <span className="font-semibold">{searchedEmail}</span>. Make sure this matches the email used during Dodo checkout.
                </p>
                <div className="mt-5">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#c2652a] text-white text-xs font-bold hover:bg-[#a8521d] transition-colors"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Place a Bid on OutBids</span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {bids.map((bid) => {
                  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
                  const favicon = bid.icon_url || getFaviconUrl(bid.url, 64);
                  const isPaid = bid.status === 'paid';

                  return (
                    <div
                      key={bid.id}
                      className="p-5 rounded-xl bg-white border border-[#d8d0c8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-[#c2652a]/60"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-[#f2ece4] border border-[#d8d0c8] flex items-center justify-center shrink-0 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={favicon}
                            alt=""
                            className="w-5 h-5 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-[#1a1a1a] truncate">
                              {bid.title || displayDomain}
                            </h4>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Paid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <span>{bid.status}</span>
                              </span>
                            )}
                            <span className="text-xs text-[#605850]">
                              {new Date(bid.created_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-[#605850] mt-1 flex-wrap">
                            <span className="font-mono text-[#1a1a1a]">{displayDomain}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-[#1a1a1a]">
                              <MousePointerClick className="w-3 h-3 text-[#c2652a]" />
                              {bid.click_count || 0} clicks
                            </span>
                            <span>•</span>
                            <span>{bid.category || 'Other'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-[#d8d0c8]">
                        <span className="text-lg font-black font-display text-[#c2652a]">
                          {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'FREE'}
                        </span>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/bid/${bid.id}`}
                            className="p-2 rounded-lg border border-[#d8d0c8] bg-[#faf5ee] hover:bg-[#f2ece4] text-[#1a1a1a] text-xs font-bold transition-colors flex items-center gap-1"
                            title="View Public Share Page"
                          >
                            <span>View</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/?topup=${encodeURIComponent(bid.url)}`}
                            className="px-3 py-2 rounded-lg bg-[#c2652a] hover:bg-[#a8521d] text-white text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Top Up</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
