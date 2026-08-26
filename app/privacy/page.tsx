import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Lock } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Outbids.auction',
  description: 'Privacy policy and data protection disclosures for Outbids.auction.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-gray-200">
      <Navbar showBackHome />

      <main className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <div className="mb-8 pb-6 border-b border-gray-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-3">
            <Lock className="w-3.5 h-3.5" />
            Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
            <p>
              When you use <strong>Outbids.auction</strong>, we collect minimal information necessary to deliver our real-time leaderboard service:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li><strong>Submitted Website URL</strong>: The public website link you submit to be showcased on the leaderboard.</li>
              <li><strong>Bid Amount</strong>: The monetary amount chosen for the leaderboard placement.</li>
              <li><strong>Transaction Identifiers</strong>: Unique order references generated upon checkout to reconcile payment confirmation.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. How We Use Your Information</h2>
            <p>We use the collected information exclusively to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Display and rank your submitted website URL on the public leaderboard.</li>
              <li>Broadcast real-time position updates to connected website visitors via Supabase WebSockets.</li>
              <li>Facilitate customer service, billing verification, and technical support.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Third-Party Payment Processors</h2>
            <p>
              We do not store, process, or have access to your full credit card numbers, bank account information, or financial credentials on our servers.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-2">
              <li>
                <strong>Dodo Payments Integration:</strong> When you submit a bid, your transaction is processed directly through <strong>Dodo Payments</strong> (our authorized Merchant of Record).
              </li>
              <li>
                <strong>Data Transferred:</strong> We only transmit the transaction amount, bid identifier, and associated URL metadata to Dodo Payments to generate and confirm the transaction.
              </li>
              <li>
                <strong>Payment Security Governance:</strong> Your payment methods (credit/debit cards, digital wallets) are handled directly by Dodo Payments in compliance with global PCI-DSS standards.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Cloud Infrastructure & Service Providers</h2>
            <p>We partner with industry-standard cloud providers:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li><strong>Supabase</strong>: Cloud database and real-time WebSocket replication for leaderboard synchronization.</li>
              <li><strong>Vercel</strong>: Secure cloud hosting and Edge Content Delivery Network (CDN).</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Cookies & Analytics</h2>
            <p>
              We use minimal essential session cookies required for core platform functionality and fraud prevention. We do not sell your personal data to third-party advertisers.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Your Rights & Contact</h2>
            <p>
              You have the right to request deletion of your submitted link or ask questions regarding your data privacy. Contact our privacy team at:
              <br />
              <a href="mailto:support@outbids.auction" className="text-emerald-400 hover:underline font-medium">
                support@outbids.auction
              </a>
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
