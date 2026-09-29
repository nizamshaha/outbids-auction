import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Lock, Eye, Database, Server, ShieldCheck, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Outbids.auction',
  description: 'Privacy policy, visitor identifier cookies, checkout data handling, and public listing disclosures for Outbids.auction.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 font-sans selection:bg-[#FF4B4B] selection:text-white">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-10 pb-6 border-b border-gray-100">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200 mb-3">
            <Lock className="w-3.5 h-3.5 text-[#FF4B4B]" />
            Data Protection
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-950 tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Last Updated: August 2026 • Visitor & Customer Privacy Disclosures
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-gray-700">
          {/* Section 1: Overview */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <Eye className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                1. Data Minimization & Principles
              </h2>
            </div>
            <p>
              At <strong>Outbids.auction</strong>, we adhere to strict data minimization. We do not run intrusive ad trackers, cross-site trackers, or invasive fingerprinters. We collect only what is strictly necessary to run the live attention marketplace.
            </p>
          </section>

          {/* Section 2: Visitor Identifier Cookies & Analytics */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <Server className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                2. Visitor Identifier Cookies & Presence Tracking
              </h2>
            </div>
            <p>
              When you browse OutBids.auction, our systems process minimal telemetry:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-gray-600">
              <li>
                <strong>Ephemeral WebSocket Presence:</strong> We maintain a lightweight real-time WebSocket connection to display the active viewer count (&quot;Active Now&quot; ticker). No IP addresses or identities are saved to database disks for presence.
              </li>
              <li>
                <strong>24-Hour Salted Click Hashes:</strong> When you click an outbound listing link, our redirect service computes a salted, one-way HMAC-SHA256 hash of your IP address to prevent artificial click flooding within a 24-hour window. Your raw IP address is discarded immediately.
              </li>
              <li>
                <strong>Standard Google Analytics (GA4):</strong> We use standard aggregate Google Analytics to understand traffic source metrics and page performance.
              </li>
            </ul>
          </section>

          {/* Section 3: Checkout Data Handling */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <Database className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                3. Checkout Data Handling & Payment Information
              </h2>
            </div>
            <p>
              Payment processing is handled entirely by our online Merchant of Record, <strong>Dodo Payments</strong>.
            </p>
            <p className="text-gray-600">
              OutBids.auction never receives, stores, or processes full credit card numbers, CVVs, or bank details. When you complete checkout, Dodo Payments provides us with a cryptographic transaction identifier, payment status, and order metadata to fulfill your live listing.
            </p>
          </section>

          {/* Section 4: Public Listing Disclosure */}
          <section className="p-6 rounded-2xl bg-gray-50/60 border border-gray-200/80 space-y-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#FF4B4B] shrink-0" />
              <h2 className="text-xl sm:text-2xl font-black text-gray-950">
                4. Public Listing Disclosure
              </h2>
            </div>
            <p>
              By design, OutBids.auction is a <strong>public digital advertising billboard</strong>.
            </p>
            <p className="text-gray-600">
              Information submitted for your listing (including destination URL, social @handle, page title, favicon, category, and total dollar bid amount) is visible to anyone on the internet, indexed by search engines, and streamed via our RSS feed (<code className="text-xs font-mono bg-gray-100 px-1 py-0.5 rounded">/feed.xml</code>). Do not submit private personal data or confidential URLs.
            </p>
          </section>

          {/* Section 5: Data Rights & Contact */}
          <section className="p-6 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-gray-900">Privacy Concerns or Data Requests?</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Contact our privacy compliance officer at sales@outbids.auction.
              </p>
            </div>
            <a
              href="mailto:sales@outbids.auction?subject=Privacy%20Request%20-%20OutBids"
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
