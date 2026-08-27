'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { PLATFORM_CATEGORIES, BidCategory } from '@/types/bid';
import { formatCentsToDollars, sanitizeAndNormalizeUrl, getFaviconUrl } from '@/utils/formatters';
import {
  ShieldCheck,
  Lock,
  Loader2,
  RefreshCw,
  Trash2,
  Edit3,
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
  X,
  Save,
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

  // Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Listing State
  const [editingBid, setEditingBid] = useState<AdminBid | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState<BidCategory>('SEO & AI Visibility');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'paid' | 'pending'>('paid');
  const [editLoading, setEditLoading] = useState(false);
  const [editFeedback, setEditFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      const res = await fetch('/api/admin/auth/check', { cache: 'no-store' });
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
      const res = await fetch('/api/admin/bids', { cache: 'no-store' });
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

  // Handle Opening the Edit Modal
  const handleOpenEdit = (bid: AdminBid) => {
    setEditingBid(bid);
    setEditUrl(bid.url);
    setEditTitle(bid.title || '');
    setEditAmount((bid.amount / 100).toString());
    setEditCategory((bid.category as BidCategory) || 'SEO & AI Visibility');
    setEditDescription(bid.description || '');
    setEditStatus(bid.status === 'paid' ? 'paid' : 'pending');
    setEditFeedback(null);
  };

  // Handle Saving the Edited Listing
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBid) return;

    setEditLoading(true);
    setEditFeedback(null);

    const parsedDollars = parseFloat(editAmount);
    if (isNaN(parsedDollars) || parsedDollars < 0) {
      setEditFeedback({ type: 'error', text: 'Please enter a valid non-negative bid amount.' });
      setEditLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/admin/bids/${editingBid.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: editUrl.trim(),
          title: editTitle.trim() || undefined,
          amountInDollars: parsedDollars,
          category: editCategory,
          description: editDescription.trim() || undefined,
          status: editStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update listing.');
      }

      // Update state locally
      setBids((prev) =>
        prev.map((b) => (b.id === editingBid.id ? { ...b, ...data.bid } : b))
      );

      const { displayDomain } = sanitizeAndNormalizeUrl(editUrl);
      setToastMessage(`✓ Listing for "${displayDomain}" updated successfully ($${parsedDollars.toFixed(2)})!`);
      setTimeout(() => setToastMessage(null), 4500);
      setEditingBid(null);
      loadBids();
    } catch (err: any) {
      setEditFeedback({ type: 'error', text: err.message || 'Failed to update listing.' });
    } finally {
      setEditLoading(false);
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}: Failed to delete listing.`);
      }
      setBids((prev) => prev.filter((b) => b.id !== id));
      setToastMessage(`✓ Listing "${domain}" removed successfully.`);
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete listing.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Re-scrape / Refresh Metadata
  const handleRefreshMetadata = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/bids/${id}/refresh`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to refresh metadata.');

      setBids((prev) =>
        prev.map((b) =>
          b.id === id
            ? {
                ...b,
                title: data.bid.title,
                description: data.bid.description,
                icon_url: data.bid.icon_url,
              }
            : b
        )
      );
      setToastMessage('✓ Metadata re-scraped and updated successfully!');
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to refresh metadata.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter Bids for Display
  const filteredBids = bids.filter((b) => {
    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      b.url.toLowerCase().includes(q) ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.category && b.category.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // -------------------------------------------------------------
  // RENDER: Loading or Login Gate (High-Contrast WCAG-Compliant Dark Theme)
  // -------------------------------------------------------------
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl text-center space-y-6">
          {/* Header Icon */}
          <div className="w-14 h-14 rounded-2xl bg-orange-500/15 border border-orange-500/30 text-orange-400 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Admin Command Center
            </h1>
            <p className="text-sm text-gray-300 mt-1.5 leading-relaxed font-medium">
              Enter your master password to manage board seeding & moderation.
            </p>
          </div>

          {/* Feedback Banners */}
          {authError && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-200 text-xs sm:text-sm font-semibold flex items-center gap-2.5 text-left">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin Master Password"
              required
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-inner"
            />

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-sm transition-all shadow-lg shadow-orange-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
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
  // RENDER: Authenticated Admin Dashboard (WCAG High-Contrast Dark Theme)
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col font-sans selection:bg-orange-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="sticky top-0 z-50 py-3 px-4 bg-emerald-950 text-emerald-200 border-b border-emerald-500/50 text-xs sm:text-sm font-bold flex items-center justify-center gap-2.5 shadow-lg backdrop-blur-md animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-3 text-xs underline text-emerald-300 hover:text-white cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Top Header */}
      <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 border border-orange-500/40 flex items-center justify-center text-orange-400 font-black">
              ⚡
            </div>
            <div>
              <span className="text-base font-black text-white tracking-tight">OUTBIDS ADMIN</span>
              <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                LIVE PRODUCTION
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-700 text-gray-200 hover:text-white hover:bg-gray-800 text-xs font-bold transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>View Live Board</span>
            </a>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/80 border border-red-500/40 text-red-200 hover:bg-red-900/80 text-xs font-bold transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal: Inline Editor for Active Listings */}
      {editingBid && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg p-6 rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-400" />
                <h3 className="font-bold text-lg text-white">Edit Listing & Bid Amount</h3>
              </div>
              <button
                onClick={() => {
                  setEditingBid(null);
                  setEditFeedback(null);
                }}
                className="p-1 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                  editFeedback.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                    : 'bg-red-950/80 border border-red-500/50 text-red-200'
                }`}
              >
                {editFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{editFeedback.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-left">
              {/* Target URL */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                  Website URL or @handle
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <LinkIcon className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    required
                    placeholder="https://example.com"
                    className="w-full pl-9 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                  />
                </div>
              </div>

              {/* Title & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Display Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="e.g. My Awesome Project"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Bid Amount ($ USD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <DollarSign className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      required
                      placeholder="0.00"
                      className="w-full pl-8 pr-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value as BidCategory)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    {PLATFORM_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} className="bg-gray-900 text-white">
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                    Listing Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="paid" className="bg-gray-900 text-white">Paid (Live)</option>
                    <option value="pending" className="bg-gray-900 text-white">Pending</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional brief description"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingBid(null);
                    setEditFeedback(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-gray-700 bg-gray-900 hover:bg-gray-850 text-gray-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs transition-all shadow-md shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {editLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save & Sync Database</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <main className="container mx-auto px-4 py-8 max-w-6xl flex-1 space-y-8">
        {/* Metrics Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-gray-950 border border-gray-800 shadow-sm">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Total Volume
              </span>
              <span className="text-2xl font-black text-emerald-400 mt-1 block">
                ${stats.totalVolumeDollars.toLocaleString()}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gray-950 border border-gray-800 shadow-sm">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Paid Live Bids
              </span>
              <span className="text-2xl font-black text-white mt-1 block">
                {stats.paidCount}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gray-950 border border-gray-800 shadow-sm">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Pending Bids
              </span>
              <span className="text-2xl font-black text-amber-400 mt-1 block">
                {stats.pendingCount}
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-gray-950 border border-gray-800 shadow-sm">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Total Database Rows
              </span>
              <span className="text-2xl font-black text-gray-200 mt-1 block">
                {stats.totalCount}
              </span>
            </div>
          </div>
        )}

        {/* --- SECTION 1: SEEDING ENGINE --- */}
        <section className="p-6 rounded-3xl bg-gray-950 border border-gray-800 shadow-xl space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Board Seeding Engine (Bypass Gateway)</h2>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">
                Instantly insert a verified listing into the live leaderboard without charging through Dodo Payments.
              </p>
            </div>
          </div>

          {seedFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2.5 ${
                seedFeedback.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                  : 'bg-red-950/80 border border-red-500/50 text-red-200'
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
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={seedUrl}
                  onChange={(e) => setSeedUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                />
              </div>

              {/* Amount in USD */}
              <div className="sm:col-span-3 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
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
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner font-mono"
                />
              </div>

              {/* Category */}
              <div className="sm:col-span-4 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Tag className="w-3.5 h-3.5" />
                </div>
                <select
                  value={seedCategory}
                  onChange={(e) => setSeedCategory(e.target.value as BidCategory)}
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-900 border border-gray-700 rounded-xl text-white text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer shadow-inner"
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
                className="w-full px-3.5 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
              />
              <input
                type="text"
                value={seedDescription}
                onChange={(e) => setSeedDescription(e.target.value)}
                placeholder="Optional Description override (auto-scrapes if blank)"
                className="w-full px-3.5 py-2 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Automatically scrapes Title, Description & Favicon if blank
              </span>

              <button
                type="submit"
                disabled={seedLoading}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-extrabold text-xs transition-all shadow-md shadow-orange-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {seedLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
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
        <section className="p-6 rounded-3xl bg-gray-950 border border-gray-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-white">Live Moderation & Inline Listing Editor</h2>
              <p className="text-xs sm:text-sm text-gray-300 font-medium">
                Click on any listing or bid amount to edit and sync changes directly to the production database.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-60">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Search className="w-3.5 h-3.5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter listings..."
                  className="w-full pl-8 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e: any) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-xl text-xs text-white font-bold focus:outline-none cursor-pointer shadow-inner"
              >
                <option value="all" className="bg-gray-900 text-white">All Status</option>
                <option value="paid" className="bg-gray-900 text-white">Paid Only</option>
                <option value="pending" className="bg-gray-900 text-white">Pending Only</option>
              </select>

              <button
                onClick={loadBids}
                disabled={loadingData}
                className="p-2 rounded-xl bg-gray-900 border border-gray-700 text-gray-200 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-orange-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-950">
            <table className="w-full text-left text-xs text-gray-100">
              <thead className="bg-gray-900 text-gray-200 uppercase text-[10px] tracking-wider border-b border-gray-800 font-extrabold">
                <tr>
                  <th className="py-3 px-4">Listing & Domain</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Amount (Bid)</th>
                  <th className="py-3 px-3">Clicks</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80 bg-gray-950">
                {filteredBids.map((bid) => {
                  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
                  const favicon = bid.icon_url || getFaviconUrl(bid.url);
                  const isLoading = actionLoadingId === bid.id;

                  return (
                    <tr key={bid.id} className="hover:bg-gray-900/60 transition-colors group">
                      {/* Domain & Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-900 border border-gray-700 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={favicon}
                              alt=""
                              className="w-4 h-4 object-contain"
                              onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => handleOpenEdit(bid)}
                                title="Click to edit"
                                className="font-bold text-white hover:text-orange-400 transition-colors truncate cursor-pointer underline decoration-dotted decoration-gray-600 hover:decoration-orange-400"
                              >
                                {bid.title || displayDomain}
                              </span>
                              <a
                                href={`/go/${bid.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                title="Visit destination link"
                                className="text-gray-400 hover:text-orange-400"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            </div>
                            <span className="text-[11px] text-gray-300 font-medium truncate block">{displayDomain}</span>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <span
                          onClick={() => handleOpenEdit(bid)}
                          title="Click to edit category"
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-900 border border-gray-700 text-gray-200 cursor-pointer hover:border-orange-500 hover:text-orange-300 transition-colors"
                        >
                          {bid.category || 'Other'}
                        </span>
                      </td>

                      {/* Amount (Click to Edit) */}
                      <td className="py-3 px-3 font-bold text-white">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(bid)}
                          title="Click to edit bid amount"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-gray-900 border border-transparent hover:border-gray-700 transition-colors cursor-pointer font-bold text-emerald-400 font-mono text-xs sm:text-sm"
                        >
                          <span>{bid.amount > 0 ? formatCentsToDollars(bid.amount) : 'Free ($0)'}</span>
                          <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                        </button>
                      </td>

                      {/* Clicks */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 text-gray-200 font-bold font-mono">
                          <MousePointerClick className="w-3 h-3 text-gray-400" />
                          {bid.click_count || 0}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        <span
                          onClick={() => handleOpenEdit(bid)}
                          title="Click to toggle status"
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-opacity hover:opacity-80 ${
                            bid.status === 'paid'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                          }`}
                        >
                          {bid.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(bid)}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-orange-500/20 border border-gray-700 text-gray-200 hover:text-orange-300 transition-colors cursor-pointer"
                            title="Edit listing details and bid amount"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleRefreshMetadata(bid.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-200 hover:text-orange-400 transition-colors cursor-pointer disabled:opacity-40"
                            title="Re-scrape and update metadata"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-orange-400' : ''}`} />
                          </button>

                          <button
                            onClick={() => handleDeleteBid(bid.id, displayDomain)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-900/80 border border-red-500/40 text-red-200 transition-colors cursor-pointer disabled:opacity-40"
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
              <div className="py-8 text-center text-xs sm:text-sm text-gray-300 font-semibold">
                No listings found matching your search.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
