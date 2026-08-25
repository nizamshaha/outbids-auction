import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { AlertTriangle, RefreshCcw, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy | Outbids.auction',
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
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Refund & Cancellation Policy</h1>
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
                  Due to the immediate digital fulfillment and instantaneous live broadcast of leaderboard placements, all completed bids and purchases on <strong>Outbids.auction</strong> are <strong>final and non-refundable</strong> once payment has been verified.
                </p>
              </div>
            </div>
          </div>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Nature of Digital Service</h2>
            <p>
              When you submit a bid on Outbids.auction, fulfillment occurs immediately: your URL is written to our production database and broadcasted in real-time to all connected visitors across the globe via WebSockets. Because this digital service is consumed instantaneously upon payment confirmation, standard cooling-off periods and discretionary refunds do not apply.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Dynamic Ranking Mechanism</h2>
            <p>
              Leaderboard rankings are determined dynamically based on the highest active bid amounts. Submitting a bid guarantees placement on the leaderboard corresponding to your bid amount at the moment of verification.
            </p>
            <p>
              However, you understand that other participants may submit higher bids at any subsequent time, which will naturally adjust your rank. <strong>Changes in ranking position due to subsequent user bids do not qualify for a refund.</strong>
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Technical Errors & Duplicate Charges</h2>
            <p>
              In the rare event of a verified technical error (e.g. duplicate credit card charges caused by network latency, or a paid transaction that failed to register on the leaderboard due to a server failure), we will issue a full refund or manually adjust your placement.
            </p>
            <p>
              To request an investigation for a technical issue:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Email us within 7 days of the transaction at <a href="mailto:support@outbids.auction" className="text-indigo-400 hover:underline">support@outbids.auction</a>.</li>
              <li>Include your transaction reference ID, payment receipt, and submitted website URL.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Merchant of Record Inquiries</h2>
            <p>
              Payments and invoicing are handled by <strong>Dodo Payments</strong>. If you have questions regarding your billing receipt, invoice, or regional sales tax, you may contact Dodo Payments support or our team at <a href="mailto:support@outbids.auction" className="text-indigo-400 hover:underline">support@outbids.auction</a>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
