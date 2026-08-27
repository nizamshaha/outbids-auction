import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RefreshCcw, AlertTriangle, ShieldCheck, Zap, Mail, HelpCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Refund Policy | Outbids.auction',
  description: 'Strict No-Refund policy, billing terms, and technical error resolution for Outbids.auction.',
};

export default function RefundsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] font-sans selection:bg-[#c2652a]/20">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-12 pb-8 border-b border-[#d8d0c8]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f2ece4] text-[#c2652a] border border-[#d8d0c8] mb-4">
            <RefreshCcw className="w-3.5 h-3.5" />
            Billing & Fulfillment Policy
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-[#1a1a1a] tracking-tight">
            Refund & Cancellation Policy
          </h1>
          <p className="text-sm text-[#605850] mt-3 font-medium">
            Effective Date: August 2026 • Strict Digital Fulfillment Governance
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-base leading-relaxed text-[#3a302a]">
          {/* Prominent compliance callout */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[#f2ece4] border-2 border-[#c2652a]/40 shadow-sm text-[#1a1a1a]">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-[#c2652a] shrink-0 mt-1" />
              <div className="space-y-2">
                <h3 className="font-bold text-xl font-display text-[#1a1a1a]">
                  Instantaneous Digital Delivery: Strict &quot;No Refund&quot; Policy
                </h3>
                <p className="text-sm sm:text-base text-[#3a302a] leading-relaxed">
                  Due to the immediate digital fulfillment and instantaneous live broadcast of leaderboard placements across our global network, <strong>all processed bids and top-ups are strictly final and non-refundable once payment has been captured</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                1. Immediate Service Execution
              </h2>
            </div>
            <p>
              When your payment is confirmed by our Merchant of Record, <strong>Dodo Payments</strong>:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base">
              <li>Your bid is registered in our authoritative database in real time.</li>
              <li>Your domain, title, and badge are immediately published on the global leaderboard.</li>
              <li>WebSocket events instantly broadcast your ranking position to all concurrent visitors.</li>
            </ul>
            <p>
              Because digital exposure begins the precise second payment is cleared, the advertising service is considered fully rendered upon delivery.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                2. Market Mechanics & Competitive Outbidding
              </h2>
            </div>
            <p>
              Outbids.auction is a live, competitive attention market. If a competing user places a higher bid and overtakes your position (e.g., your listing moves from #1 to #2, or off the top podium), <strong>this is a normal, intended dynamic of the open market and does not entitle you to a refund</strong>.
            </p>
            <p>
              You may increase your bid amount at any time by paying the delta difference to reclaim a higher rank.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
              3. Policy Violations & Content Removal
            </h2>
            <p>
              In accordance with our{' '}
              <Link href="/terms" className="text-[#c2652a] font-bold hover:underline">
                Terms of Service
              </Link>
              , any listing found to contain malware, illegal services, scams, phishing, or hate speech will be immediately removed and permanently banned without any refund.
            </p>
          </section>

          {/* Section 4 - Technical Resolution */}
          <section className="space-y-4 bg-[#f2ece4] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8]">
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                4. Technical Errors & Support Resolution
              </h2>
            </div>
            <p>
              In the rare event of a technical fulfillment error (e.g., your payment was successfully captured by Dodo Payments, but your listing failed to display due to a network glitch):
            </p>
            <p className="text-sm font-medium">
              Please contact our dedicated support team within 48 hours of payment with your <strong>Payment Reference ID</strong> and submitted URL:
            </p>
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <a
                href="mailto:sales@outbids.auction?subject=Payment%20Fulfillment%20Inquiry%20-%20outbids.auction&body=Please%20provide%20your%20Payment%20Reference%20ID%20and%20Target%20URL:"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c2652a] text-white font-bold text-sm hover:bg-[#c2652a]/90 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>sales@outbids.auction</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d8d0c8] bg-[#faf5ee] text-[#1a1a1a] font-bold text-sm hover:bg-[#faf5ee]/80 transition-colors"
              >
                Help & Contact
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
