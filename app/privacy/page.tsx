import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Lock, Eye, Database, Server, ShieldCheck, Mail } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Outbids.auction',
  description: 'Privacy policy, data protection disclosures, and analytics disclosures for Outbids.auction.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] font-sans selection:bg-[#c2652a]/20">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Page Header */}
        <div className="mb-12 pb-8 border-b border-[#d8d0c8]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f2ece4] text-[#c2652a] border border-[#d8d0c8] mb-4">
            <Lock className="w-3.5 h-3.5" />
            Data Protection & Privacy
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-display text-[#1a1a1a] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#605850] mt-3 font-medium">
            Effective Date: August 2026 • User Data Governance & Disclosures
          </p>
        </div>

        {/* Content Body */}
        <div className="space-y-10 text-base leading-relaxed text-[#3a302a]">
          {/* Section 1 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                1. Information We Collect
              </h2>
            </div>
            <p>
              At <strong>Outbids.auction</strong>, we prioritize radical transparency and data minimization. We only collect information essential to operate our real-time attention marketplace:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base">
              <li>
                <strong>Public Website URL / Handle:</strong> The destination link you submit to be displayed publicly on the live leaderboard.
              </li>
              <li>
                <strong>Metadata Scrapes:</strong> Public titles, descriptions, and OpenGraph icons fetched from your public destination to generate your listing card.
              </li>
              <li>
                <strong>Bid Amounts & Transaction References:</strong> Monetary values (in USD) and cryptographic payment IDs issued by our payment gateway to reconcile verified leaderboard rankings.
              </li>
              <li>
                <strong>Anonymized Click Hashes:</strong> Salted, one-way HMAC-SHA256 hashes of visitor IP addresses used strictly for 24-hour unique click deduplication. We do not store raw visitor IP addresses.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                2. How Your Data Is Utilized
              </h2>
            </div>
            <p>We process collected data exclusively to:</p>
            <ul className="list-disc list-inside space-y-2 pl-2 text-sm sm:text-base">
              <li>Calculate and broadcast authoritative rankings to all live connected viewers via real-time WebSockets.</li>
              <li>Deliver verified, deduplicated outbound visitor redirects through our tracked routing service.</li>
              <li>Prevent automated bot spam, click fraud, and denial-of-service abuse.</li>
              <li>Provide customer billing assistance and transaction reconciliation.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                3. Third-Party Payment Security & Merchant of Record
              </h2>
            </div>
            <p>
              We do not collect, store, or process credit card numbers or banking credentials on our servers. All financial transactions are managed by our Merchant of Record, <strong>Dodo Payments</strong>.
            </p>
            <p className="text-sm text-[#605850]">
              Dodo Payments is certified to global PCI-DSS Level 1 security standards and governs all checkout transactions, fraud monitoring, and tax compliance.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-4 bg-[#faf5ee] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8] shadow-sm">
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-[#c2652a] shrink-0" />
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
                4. Infrastructure & Data Retention
              </h2>
            </div>
            <p>
              Our application is hosted on <strong>Vercel Edge Infrastructure</strong> with database and real-time state managed by <strong>Supabase</strong> (PostgreSQL). We maintain industry-standard TLS 1.3 encryption for all data in transit and AES-256 encryption for data at rest.
            </p>
            <p>
              Anonymized click deduplication logs are automatically purged or rotated after 24 hours.
            </p>
          </section>

          {/* Section 5 - Rights & Contact */}
          <section className="space-y-4 bg-[#f2ece4] p-6 sm:p-8 rounded-2xl border border-[#d8d0c8]">
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a]">
              5. Your Privacy Rights & Contact
            </h2>
            <p>
              You have the right to request deletion of your submitted link or review any transaction details associated with your listing. To exercise these rights or inquire about our privacy architecture, contact:
            </p>
            <div className="pt-2 flex flex-wrap gap-4 items-center">
              <a
                href="mailto:sales@outbids.auction?subject=Privacy%20Inquiry%20-%20outbids.auction"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#c2652a] text-white font-bold text-sm hover:bg-[#c2652a]/90 transition-colors shadow-sm"
              >
                <Mail className="w-4 h-4" />
                <span>sales@outbids.auction</span>
              </a>
              <Link
                href="/terms"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#d8d0c8] bg-[#faf5ee] text-[#1a1a1a] font-bold text-sm hover:bg-[#faf5ee]/80 transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
