import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText, ShieldAlert, CheckCircle2, Scale, Mail, AlertTriangle, ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Outbids.auction',
  description: 'Terms of Service, operator information, no-refund policy, and listing rules for Outbids.auction.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans selection:bg-[#FF4B4B] selection:text-white">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-gray-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-[#FF4B4B] border border-red-100 mb-3">
            <FileText className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Last Updated: August 2026 • Official Platform Terms of Use
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">
          {/* Section 1: Operator Info */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <Scale className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                1. Operator Information & Acceptance
              </h2>
            </div>
            <p>
              Welcome to <strong>Outbids.auction</strong> (the &quot;Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). OutBids.auction operates a live, real-time attention marketplace and competitive digital billboard.
            </p>
            <p>
              By accessing our website, placing a bid, claiming a rank, or submitting a destination URL or handle, you acknowledge that you have read, understood, and unconditionally agree to these Terms of Service. If you disagree, do not use the service or submit bids.
            </p>
          </section>

          {/* Section 2: Live Digital Real Estate & Outbidding */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                2. Live Digital Real Estate & Ranking Dynamics
              </h2>
            </div>
            <p>
              Outbids.auction allocates dynamic, competitive digital visibility:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-gray-600">
              <li>
                <strong>Instant Live Broadcast:</strong> Once payment is confirmed by our merchant processor, your listing goes live instantaneously across all active viewer connections via WebSockets.
              </li>
              <li>
                <strong>Competitive Displacement:</strong> Leaderboard positions are strictly determined by cumulative bid amount (in USD). Anyone can outbid your position at any time by placing a higher bid.
              </li>
              <li>
                <strong>Deterministic Tie-Breaking:</strong> When two bids share the exact same dollar amount, priority is awarded to the earliest established bid (<code className="text-xs bg-gray-100 px-1 py-0.5 rounded font-mono">created_at ASC</code>).
              </li>
              <li>
                <strong>Top-Ups:</strong> Listing holders may top up their existing link at any time to climb back to higher ranks by paying the incremental difference.
              </li>
            </ul>
          </section>

          {/* Section 3: No-Refund Policy */}
          <section className="p-6 rounded-2xl bg-red-50/50 border border-red-200/70 space-y-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-red-950">
                3. Strict No-Refund Policy on Live Digital Real Estate
              </h2>
            </div>
            <p className="text-red-900 font-medium">
              Because digital real estate is delivered and broadcast live to thousands of concurrent users the moment transaction verification completes, all purchases are non-refundable and final.
            </p>
            <p className="text-red-800 text-xs sm:text-sm">
              We do NOT offer refunds or chargeback allowances if your listing is subsequently outbid by a competitor, drops in rank, receives fewer clicks than anticipated, or is removed due to a violation of our prohibited content policy. You pay for the right to hold a competitive rank at that specific moment in time.
            </p>
          </section>

          {/* Section 4: Listing Rules & Prohibited Content */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                4. Listing Rules & Prohibited Content
              </h2>
            </div>
            <p>
              To protect all visitors and maintain platform integrity, the following categories are strictly prohibited:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-gray-600">
              <li>Malware, spyware, ransomware, credential harvest pages, or phishing vectors.</li>
              <li>Pornography, sexually explicit media, NSFW, or adult escort services.</li>
              <li>Illicit narcotics, darknet marketplaces, weapons, or unlicensed gambling.</li>
              <li>Private invite-only chat groups (Telegram, Discord, WhatsApp) promoting unverified financial schemes.</li>
              <li>Hate speech, defamation, harassment, or intellectual property infringements.</li>
            </ul>
            <div className="p-3.5 rounded-xl bg-white border border-gray-200 text-xs font-semibold text-gray-800 mt-3">
              ⚠️ <strong>Platform Moderation Right:</strong> We reserve the right to immediately suspend, delist, or redirect any violating URL without prior warning, liability, or refund.
            </div>
          </section>

          {/* Section 5: Merchant of Record */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-950">
              5. Merchant of Record & Payment Fulfillment
            </h2>
            <p>
              Our order process is conducted by our online Merchant of Record, <strong>Dodo Payments</strong>. Dodo Payments handles all checkout infrastructure, invoicing, applicable sales tax calculation, and PCI-DSS compliance.
            </p>
            <p>
              By continuing to checkout, you authorize Dodo Payments to charge your payment instrument for the full amount stated on the confirmation screen in USD.
            </p>
          </section>

          {/* Section 6: Liability Disclaimer */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <h2 className="text-xl sm:text-2xl font-black text-gray-950">
              6. Limitation of Liability & Warranty Disclaimer
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              OutBids.auction is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no warranty that leaderboard display will produce specific click volumes, revenue, search engine rankings, or business success. In no event shall OutBids.auction or its operators be liable for indirect, punitive, or consequential damages.
            </p>
          </section>

          {/* Section 7: Contact & Inquiries */}
          <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900">Questions or Abuse Reports?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Contact our compliance and support desk at sales@outbids.auction.
              </p>
            </div>
            <a
              href="mailto:sales@outbids.auction?subject=Terms%20Inquiry%20-%20OutBids"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 transition-colors shrink-0"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>sales@outbids.auction</span>
            </a>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
