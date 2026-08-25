import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Lock, Shield, Eye } from 'lucide-react';
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
              <li><strong>Transaction Metadata</strong>: Billing email and order reference IDs generated upon checkout.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Payment Data & Security</h2>
            <p>
              We do <strong>not</strong> collect, process, or store your credit card numbers, bank accounts, or sensitive financial information on our servers.
            </p>
            <p>
              All payment transactions are processed directly by our Merchant of Record, <strong>Dodo Payments</strong>, in compliance with PCI-DSS standards and global banking encryption protocols.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. How We Use Your Information</h2>
            <p>We use the collected information exclusively to:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Display and rank your submitted website URL on the public leaderboard.</li>
              <li>Broadcast real-time position updates to connected website visitors via Supabase WebSockets.</li>
              <li>Facilitate customer service, billing inquiries, and fraud prevention.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Third-Party Service Providers</h2>
            <p>We partner with trusted third-party providers:</p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li><strong>Dodo Payments</strong>: Merchant of Record for payment processing, tax compliance, and fraud detection.</li>
              <li><strong>Supabase</strong>: Cloud database and real-time WebSocket replication for leaderboard synchronization.</li>
              <li><strong>Vercel</strong>: Hosting infrastructure and Content Delivery Network (CDN).</li>
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
              <a href="mailto:support@outbids.auction" className="text-indigo-400 hover:underline font-medium">
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
