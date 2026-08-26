import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FileText } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Outbids.auction',
  description: 'Terms of Service, user agreement, and platform rules for Outbids.auction.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="mb-10 pb-6 border-b border-outline-variant">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-primary border border-outline-variant mb-3">
            <FileText className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-on-surface tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-text-muted mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-base leading-relaxed text-text-muted">
          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>Outbids.auction</strong> (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Platform or submit bids.
            </p>
          </section>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">2. Description of Service & Business Model</h2>
            <p>
              Outbids.auction is a real-time digital advertising leaderboard. Users submit a valid website URL and monetary bid to display their website and domain on the public global leaderboard. Ranking on the leaderboard is determined strictly by the amount bid (in USD).
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Rankings are dynamic and update instantly in real-time via WebSocket connections.</li>
              <li>A higher bid from another user will reposition earlier bids lower on the leaderboard.</li>
              <li>Bidding starts at a minimum of $1.00 USD.</li>
            </ul>
          </section>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">3. Content Guidelines & Acceptable Use</h2>
            <p>
              You represent and warrant that the website URL you submit:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Does not contain malware, phishing, malicious software, or deceptive scams.</li>
              <li>Does not promote hate speech, illegal narcotics, adult pornography, or illegal activities.</li>
              <li>Does not infringe upon third-party intellectual property or copyright laws.</li>
            </ul>
            <p>
              We reserve the right to review and remove any URL violating these guidelines without notice or liability.
            </p>
          </section>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">4. Payments, Fulfillment & Dodo Payments Disclosures</h2>
            <p>
              Our order process is conducted by our online reseller and Merchant of Record, <strong>Dodo Payments</strong>.
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Digital Fulfillment: Your submitted URL is processed immediately upon successful payment clearance.</li>
              <li>Final Sale: Placements are broadcast in real-time immediately upon checkout completion. All bid fees are non-refundable.</li>
              <li>Currency: All bids and pricing are processed in United States Dollars (USD).</li>
            </ul>
          </section>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">5. Contact Information</h2>
            <p>
              For any questions regarding these Terms of Service or billing inquiries, please contact us at{' '}
              <a href="mailto:support@outbids.auction" className="text-primary font-bold hover:underline">
                support@outbids.auction
              </a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
