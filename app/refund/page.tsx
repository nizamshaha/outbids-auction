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
    <div className="min-h-screen flex flex-col bg-[#08090d] text-gray-200">
      <Navbar showBackHome />

      <main className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <div className="mb-8 pb-6 border-b border-gray-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-3">
            <RefreshCcw className="w-3.5 h-3.5" />
            Billing Disclosure
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Refund Policy</h1>
          <p className="text-sm text-gray-400 mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          {/* Prominent compliance callout */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base text-amber-300">Important Notice Regarding Real-Time Leaderboard Placements</h3>
                <p className="text-xs sm:text-sm text-amber-200/90 mt-1">
                  Thank you for participating on <strong>Outbids.auction</strong>. Due to the immediate digital fulfillment and instantaneous live broadcast of leaderboard placements, all completed bids are strictly final and non-refundable once payment is captured.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Digital Advertising Service Nature</h2>
            <p>
              Outbids.auction provides immediate, dynamic digital billboard placements. When your payment is confirmed by <strong>Dodo Payments</strong>:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Your bid is processed in real time.</li>
              <li>Your submitted link and ranking are instantly broadcasted on the live leaderboard.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. No Refunds on Active Bids</h2>
            <p>
              Because placement occurs immediately upon payment capture, <strong>all successful bid payments are strictly non-refundable</strong>.
            </p>
            <p>
              If another participant subsequently places a higher bid and overtakes your position (e.g., knocking your URL down from #1 to #2 or off the podium), this is part of the core competitive dynamic of the platform and does not entitle you to a refund.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Billing Inquiries & Payment Errors</h2>
            <p>
              If you experience a technical failure where:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Your payment was captured and confirmed by Dodo Payments, but</li>
              <li>Your link failed to appear on the leaderboard due to a system error,</li>
            </ul>
            <p>
              Please contact support immediately at{' '}
              <a href="mailto:support@outbids.auction" className="text-orange-400 font-semibold hover:underline">
                support@outbids.auction
              </a>{' '}
              with your <strong>Payment ID</strong> and submitted target URL. We will investigate the transaction logs and manually restore your placement or issue a resolution.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
