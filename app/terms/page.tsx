import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText, ShieldAlert, CheckCircle2, Scale, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Outbids.auction',
  description: 'Terms of Service, acceptable use guidelines, and platform rules for Outbids.auction.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] font-sans selection:bg-[#c2652a]/20">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-12 pb-8 border-b border-[#d8d0c8]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f2ece4] text-[#c2652a] border border-[#d8d0c8] mb-4">
            <FileText className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-[#1a1a1a] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-[#605850] mt-3 font-medium">
            Effective Date: August 2026 • Official Platform Agreement
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-base leading-relaxed text-[#3a302a]">
          {/* Section 1 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                1. Acceptance of Terms & Governance
              </h2>
            </div>
            <p>
              Welcome to <strong>Outbids.auction</strong> (the &quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing our website, creating a bid, submitting a URL, or utilizing any features of our live attention marketplace, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
            <p>
              If you do not agree with any part of these terms, you must immediately discontinue use of the platform and refrain from submitting bids.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                2. Nature of the Service & Live Marketplace Mechanics
              </h2>
            </div>
            <p>
              Outbids.auction is a real-time, transparent digital attention marketplace and public advertising billboard. Participants submit public website URLs or social handles along with monetary bids to secure prioritized visibility on the global leaderboard.
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base">
              <li>
                <strong>Instantaneous Digital Fulfillment:</strong> Visibility on the leaderboard is broadcasted instantaneously upon successful payment clearance via real-time WebSocket channels.
              </li>
              <li>
                <strong>Competitive Dynamic:</strong> Rankings are strictly derived from verified bid values (in USD). If another user places a higher verified bid, your listing will be repositioned accordingly.
              </li>
              <li>
                <strong>Bidding Minimums & Increments:</strong> Standard paid placements begin at $1.00 USD. Existing listings may be upgraded at any time by paying the delta difference.
              </li>
            </ul>
          </section>

          {/* Section 3 - Critical Moderation Clause */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#c2652a]/30 shadow-sm relative overflow-hidden">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                3. Content Safety, Prohibited Activities & Moderation Rights
              </h2>
            </div>
            <p>
              We maintain zero tolerance for illegal, malicious, or deceptive content. You warrant that any submitted URL, domain, or handle:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base">
              <li>Does not distribute malware, spyware, phishing links, credential harvesters, or exploitative scripts.</li>
              <li>Does not promote illegal narcotics, unlicensed financial schemes, fraud, hate speech, or harassment.</li>
              <li>Does not contain adult pornography, sexually explicit media, or illegal materials.</li>
              <li>Does not point to private invite-only channels (Discord, Telegram, Signal, WhatsApp) designed for pump-and-dump or unverified schemes.</li>
              <li>Does not infringe upon third-party copyrights, trademarks, or intellectual property rights.</li>
            </ul>
            <div className="p-4 rounded-xl bg-[#f2ece4] border border-[#d8d0c8] text-sm font-semibold text-[#1a1a1a] mt-4">
              <strong>⚠️ Platform Moderation Right:</strong> Outbids.auction strictly reserves the unilateral right to inspect, moderate, suspend, or permanently ban any listing or URL that violates these safety guidelines without prior notice, liability, or refund.
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
              4. Merchant of Record & Payment Terms
            </h2>
            <p>
              Our order process is conducted by our online reseller and Merchant of Record, <strong>Dodo Payments</strong>. Dodo Payments handles all billing, tax compliance, and PCI-DSS payment security.
            </p>
            <p>
              By placing an order, you authorize Dodo Payments to charge your designated payment method for the full bid amount in United States Dollars (USD). Please review our{' '}
              <Link href="/refunds" className="text-[#c2652a] font-bold hover:underline">
                Refund Policy
              </Link>{' '}
              for complete details regarding payment finality.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
              5. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p className="text-sm text-[#605850]">
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no representations or warranties regarding specific traffic volumes, conversions, or business outcomes resulting from leaderboard placement. Under no circumstances shall Outbids.auction be liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          {/* Section 6 - Abuse Reporting & Support */}
          <section className="space-y-4 bg-[#f2ece4] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8]">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
              6. Violations & Abuse Reporting
            </h2>
            <p>
              If you detect any listing violating our content guidelines or intellectual property rights, please report it directly to our moderation team:
            </p>
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <a
                href="mailto:sales@outbids.auction?subject=Abuse%20Report%20-%20outbids.auction&body=Please%20describe%20the%20violating%20listing%20and%20provide%20the%20target%20URL:"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c2652a] text-white font-bold text-sm hover:bg-[#c2652a]/90 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>Report Abuse to sales@outbids.auction</span>
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d8d0c8] bg-[#faf5ee] text-[#1a1a1a] font-bold text-sm hover:bg-[#faf5ee]/80 transition-colors"
              >
                Support Center
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
