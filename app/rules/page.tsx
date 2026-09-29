import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RulesGrid } from '@/components/RulesGrid';
import { ShieldCheck, Scale, Zap, Trophy, Flame, AlertCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Platform Rules & Mechanics | Outbids.auction',
  description: 'Mechanics of all-time boards, tie-breaking policy, outbidding rules, and prohibited content policies on Outbids.auction.',
};

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans selection:bg-[#FF4B4B] selection:text-white">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full space-y-10">
        {/* Page Header */}
        <div className="border-b border-gray-100 pb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#FF4B4B] border border-red-100 mb-3">
            <Scale className="w-3.5 h-3.5" />
            Marketplace Mechanics
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
            Rules & Auction Mechanics
          </h1>
          <p className="text-base text-gray-500 mt-2 max-w-2xl leading-relaxed">
            OutBids.auction operates on transparent, mathematical rankings. Learn how all-time boards, tie-breaking, top-ups, and outbidding work.
          </p>
        </div>

        {/* 4 Core Rule Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF4B4B] font-black">
              1
            </div>
            <h3 className="font-bold text-gray-900 text-base">All-Time Bidding Board</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Every verified bid secures a position on the all-time public leaderboard. The highest active bidder holds the #1 Hero Spotlight.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF4B4B] font-black">
              2
            </div>
            <h3 className="font-bold text-gray-900 text-base">Deterministic Tie-Breaking</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              If two listings have identical bid totals, priority is strictly awarded to the earlier timestamp (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">created_at ASC</code>).
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF4B4B] font-black">
              3
            </div>
            <h3 className="font-bold text-gray-900 text-base">Outbidding & Top-Ups</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Anyone can outbid a higher spot at any moment. Existing sponsors can top up their links cumulatively by paying only the delta difference.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-200/80 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-[#FF4B4B] font-black">
              4
            </div>
            <h3 className="font-bold text-gray-900 text-base">Instant Live Broadcast</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              Payments clear within seconds via Dodo Payments. Once verified, real-time WebSockets push the updated leaderboard to all connected viewers worldwide.
            </p>
          </div>
        </div>

        {/* Detailed Mechanics Breakdown */}
        <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-4 text-sm text-gray-700 leading-relaxed">
          <h2 className="text-xl font-black text-gray-950">
            Prohibited Content & Moderation Enforcement
          </h2>
          <p>
            OutBids.auction strictly rejects and terminates links containing:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-gray-600">
            <li>Malicious software, drive-by exploit kits, or credential theft.</li>
            <li>Pornography, adult webcam sites, or sexually explicit content.</li>
            <li>Unlicensed crypto scams, pump-and-dump groups, or phishing.</li>
            <li>Invite links to private messaging groups (Discord, Telegram, WhatsApp).</li>
          </ul>
          <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-700">
            Violating listings are removed permanently without refund or liability.
          </div>
        </section>

        {/* Consumer Notice */}
        <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-900">Need more details?</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Read our full Terms of Service or visit our support desk.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/terms"
              className="px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
