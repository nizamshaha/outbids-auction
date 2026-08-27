'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PLATFORM_CATEGORIES, BidCategory } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import {
  ShieldCheck,
  Lock,
  Loader2,
  RefreshCw,
  Trash2,
  ExternalLink,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  DollarSign,
  Tag,
  Link as LinkIcon,
  Search,
  LogOut,
  MousePointerClick,
} from 'lucide-react';

interface AdminBid {
  id: string;
  created_at: string;
  updated_at?: string;
  url: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  category?: string;
  title?: string | null;
  description?: string | null;
  icon_url?: string | null;
  click_count?: number;
}

interface AdminStats {
  totalCount: number;
  paidCount: number;
  pendingCount: number;
  totalVolumeDollars: number;
}

export default function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Dashboard Data State
  const [bids, setBids] = useState<AdminBid[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');

  // Seeding Form State
  const [seedUrl, setSeedUrl] = useState('');
  const [seedAmount, setSeedAmount] = useState('25');
  const [seedCategory, setSeedCategory] = useState<BidCategory>('SEO & AI Visibility');
  const [seedTitle, setSeedTitle] = useState('');
  const [seedDescription, setSeedDescription] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedFeedback, setSeedFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Row Action Loading Map
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Check current session
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/auth/check');
      const data = await res.json();
      setIsAuthenticated(Boolean(data.authenticated));
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load Dashboard Data
  const loadBids = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      const res = await fetch('/api/admin/bids');
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      setBids(data.bids || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Failed to load bids:', err);
    } finally {
      setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      loadBids();
    }
  }, [isAuthenticated, loadBids]);

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid password.');
      }

      setIsAuthenticated(true);
      setPasswordInput('');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setBids([]);
    setStats(null);
  };

  // Handle Seeding
  const handleSeedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeedFeedback(null);

    if (!seedUrl.trim()) {
      setSeedFeedback({ type: 'error', text: 'Please enter a valid website URL.' });
      return;
    }

    setSeedLoading(true);

    try {
      const res = await fetch('/api/admin/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: seedUrl.trim(),
          amountInDollars: parseFloat(seedAmount) || 5,
          category: seedCategory,
          title: seedTitle.trim() || undefined,
          description: seedDescription.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to seed listing.');
      }

      setSeedFeedback({ type: 'success', text: data.message || 'Successfully seeded to live leaderboard!' });
      setSeedUrl('');
      setSeedTitle('');
      setSeedDescription('');
      loadBids();
    } catch (err: any) {
      setSeedFeedback({ type: 'error', text: err.message || 'Seeding failed.' });
    } finally {
      setSeedLoading(false);
    }
  };

  // Handle Delete Bid
  const handleDeleteBid = async (id: string, domain: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${domain}" from Supabase?`)) {
      return;
    }

    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/bids/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete.');
      setBids((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting bid.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Refresh Metadata
  const handleRefreshMetadata = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/bids/${id}/refresh`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh metadata.');
      
      setBids((prev) =>
        prev.map((b) => (b.id === id ? { ...b, ...data.bid } : b))
      );
    } catch (err: any) {
      alert(err.message || 'Error re-scraping target.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filtered Bids Table
  const filteredBids = bids.filter((b) => {
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      b.url.toLowerCase().includes(q) ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // -------------------------------------------------------------
  // RENDER: Loading or Login Gate
  // -------------------------------------------------------------
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#08090d] text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-gray-950/90 border border-gray-800 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">Admin Command Center</h1>
            <p className="text-xs text-gray-400 mt-1">
              Enter your master password to manage board seeding & moderation.
            </p>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin Password"
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
            />

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Unlock Command Center</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // RENDER: Authenticated Admin Dashboard
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-[#08090d] text-gray-100 flex flex-col">
      {/* Admin Top Header */}
      <header className="border-b border-gray-800/80 bg-gray-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black">
              ⚡
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">OUTBIDS ADMIN</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE PRODUCTION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Board</span>
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 hover:bg-red-500/20 text-xs font-semibold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl flex-1 space-y-8">
        {/* Metrics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel p-5 rounded-2xl border-gray-800">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Volume
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                ${stats.totalVolumeDollars.toLocaleString()}
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-gray-800">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Paid Live Bids
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {stats.paidCount}
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-gray-800">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Pending Bids
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {stats.pendingCount}
              </span>
            </div>

            <div className="glass-panel p-5 rounded-2xl border-gray-800">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                Total Database Rows
              </span>
              <span className="text-2xl font-black text-gray-300 mt-1 block">
                {stats.totalCount}
              </span>
            </div>
          </div>
        )}

        {/* --- SECTION 1: SEEDING ENGINE --- */}
        <section className="glass-panel p-6 rounded-3xl border-gray-800 bg-gray-950/80 shadow-2xl space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Board Seeding Engine (Bypass Gateway)</h2>
              <p className="text-xs text-gray-400">
                Instantly insert a verified listing into the live leaderboard without charging through PayPal.
              </p>
            </div>
          </div>

          {seedFeedback && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                seedFeedback.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/10 border border-red-500/30 text-red-300'
              }`}
            >
              {seedFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{seedFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSeedSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Target URL */}
              <div className="sm:col-span-5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                />
              </div>

              {/* Amount in USD */}
              <div className="sm:col-span-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={seedAmount}
                  onChange={(e) => setSeedAmount(e.target.value)}
                  placeholder="Amount USD ($)"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <select
                  value={seedCategory}
                  onChange={(e) => setSeedCategory(e.target.value as BidCategory)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 cursor-pointer"
                >
                  {PLATFORM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="bg-gray-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Manual Overrides */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <input
                type="text"
                value={seedTitle}
                onChange={(e) => setSeedTitle(e.target.value)}
                placeholder="Optional Title override (auto-scrapes if blank)"
                className="w-full px-3.5 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
              <input
                type="text"
                value={seedDescription}
                onChange={(e) => setSeedDescription(e.target.value)}
                placeholder="Optional Description override (auto-scrapes if blank)"
                className="w-full px-3.5 py-2 bg-gray-900/80 border border-gray-800 rounded-xl text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Automatically scrapes Title, Description & Favicon if blank
              </span>

              <button
                type="submit"
                disabled={seedLoading}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black font-extrabold text-xs transition-all shadow-md shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {seedLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Seeding...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Seed to Leaderboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </section>

        {/* --- SECTION 2: LIVE MODERATION DATA TABLE --- */}
        <section className="glass-panel p-6 rounded-3xl border-gray-800 bg-gray-950/80 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white">Live Moderation & Listings</h2>
              <p className="text-xs text-gray-400">
                Manage, re-scrape, or remove listings from the production database.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter listings..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid Only</option>
                <option value="pending">Pending Only</option>
              </select>

              <button
                onClick={loadBids}
                disabled={loadingData}
                className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-850">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                <tr>
                  <th className="py-3 px-4">Listing & Domain</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Clicks</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900">
                {filteredBids.map((bid) => {
                  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
                  const favicon = bid.icon_url || getFaviconUrl(bid.url);
                  const isLoading = actionLoadingId === bid.id;

                  return (
                    <tr key={bid.id} className="hover:bg-gray-900/40 transition-colors">
                      {/* Domain & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-black border border-gray-800 flex items-center justify-center shrink-0 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={favicon}
                              alt=""
                              className="w-4 h-4 object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <a
                              href={`/go/${bid.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-white hover:text-orange-400 transition-colors truncate flex items-center gap-1"
                            >
                              <span className="truncate">{bid.title || displayDomain}</span>
                              <ExternalLink className="w-3 h-3 text-gray-500 shrink-0" />
                            </a>
                            <span className="text-[10px] text-gray-500 truncate block">{displayDomain}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-gray-900 border border-gray-800 text-gray-300">
                          {bid.category || 'Other'}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-3 font-bold text-white">
                        {bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'Free ($0)'}
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-gray-400 font-medium">
                          <MousePointerClick className="w-3 h-3 text-gray-500" />
                          {bid.click_count || 0}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            bid.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {bid.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleRefreshMetadata(bid.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-850 border border-gray-800 text-gray-300 hover:text-orange-400 transition-colors cursor-pointer disabled:opacity-40"
                            title="Re-scrape and update metadata"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDeleteBid(bid.id, displayDomain)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 transition-colors cursor-pointer disabled:opacity-40"
                            title="Delete listing from database"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredBids.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">
                No listings found matching your search.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
