import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | Outbids.auction',
  description: 'Refund, dispute, and cancellation policy for Outbids.auction.',
};

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="mb-10 pb-6 border-b border-outline-variant">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-primary border border-outline-variant mb-3">
            <RefreshCcw className="w-3.5 h-3.5" />
            Billing Disclosure
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-on-surface tracking-tight">
            Refund Policy
          </h1>
          <p className="text-sm text-text-muted mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-base leading-relaxed text-text-muted">
          {/* Prominent compliance callout */}
          <div className="p-6 rounded-xl bg-surface-container border border-primary/30 text-on-surface">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-lg font-display text-on-surface">
                  Important Notice Regarding Real-Time Leaderboard Placements
                </h3>
                <p className="text-sm text-text-muted mt-1 leading-relaxed">
                  Thank you for participating on <strong>Outbids.auction</strong>. Due to the immediate digital fulfillment and instantaneous live broadcast of leaderboard placements, all completed bids are strictly final and non-refundable once payment is captured.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">1. Digital Advertising Service Nature</h2>
            <p>
              Outbids.auction provides immediate, dynamic digital billboard placements. When your payment is confirmed by <strong>Dodo Payments</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Your bid is processed in real time.</li>
              <li>Your submitted link and ranking are instantly broadcasted on the live leaderboard.</li>
            </ul>
          </section>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">2. No Refunds on Active Bids</h2>
            <p>
              Because placement occurs immediately upon payment capture, <strong>all successful bid payments are strictly non-refundable</strong>.
            </p>
            <p>
              If another participant subsequently places a higher bid and overtakes your position (e.g., knocking your URL down from #1 to #2 or off the podium), this is part of the core competitive dynamic of the platform and does not entitle you to a refund.
            </p>
          </section>

          <section className="space-y-3 bg-surface p-7 rounded-xl border border-outline-variant shadow-sm">
            <h2 className="text-2xl font-bold font-display text-on-surface">3. Billing Inquiries & Payment Errors</h2>
            <p>
              If you experience a technical failure where:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>Your payment was captured and confirmed by Dodo Payments, but</li>
              <li>Your link failed to appear on the leaderboard due to a system error,</li>
            </ul>
            <p>
              Please contact support immediately at{' '}
              <a href="mailto:sales@outbids.auction" className="text-primary font-bold hover:underline">
                sales@outbids.auction
              </a>{' '}
              with your <strong>Payment Reference ID</strong> and submitted target URL. We will investigate the transaction logs and manually restore your placement or issue a resolution.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
