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
    <div className="min-h-screen flex flex-col bg-[#08090d] text-gray-200">
      <Navbar showBackHome />

      <main className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <div className="mb-8 pb-6 border-b border-gray-800">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 mb-3">
            <FileText className="w-3.5 h-3.5" />
            Legal Agreement
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Terms of Service</h1>
          <p className="text-sm text-gray-400 mt-2">Last Updated: August 2026</p>
        </div>

        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using <strong>Outbids.auction</strong> (&quot;the Platform&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of these terms, you may not access the Platform or submit bids.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">2. Description of Service & Business Model</h2>
            <p>
              Outbids.auction is a real-time digital advertising leaderboard. Users submit a valid website URL and monetary bid to display their website and domain on the public global leaderboard. Ranking on the leaderboard is determined strictly by the amount bid (in USD).
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Rankings are dynamic and update instantly in real-time via WebSocket connections.</li>
              <li>A higher bid from another user will reposition earlier bids lower on the leaderboard.</li>
              <li>Bidding starts at a minimum of $1.00 USD.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">3. Content Guidelines & Acceptable Use</h2>
            <p>
              You represent and warrant that the website URL you submit:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-gray-400 pl-2">
              <li>Does not contain malware, phishing, malicious software, or deceptive scams.</li>
              <li>Does not promote hate speech, illegal narcotics, adult pornography, or illegal activities.</li>
              <li>Does not infringe upon third-party intellectual property or copyright laws.</li>
            </ul>
            <p className="text-gray-400">
              We reserve the right to review and remove any URL violating these guidelines without notice or liability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Payments, Bids, and Pricing</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-300 pl-2">
              <li>
                <strong>Payment Processing:</strong> All payments on Outbids.auction are securely processed via <strong>Dodo Payments</strong> (our Merchant of Record). By placing a bid, you authorize Dodo Payments to charge your selected payment method for the designated bid amount in USD ($).
              </li>
              <li>
                <strong>Immediate Digital Delivery:</strong> Bids represent digital placements on our real-time leaderboard. Service delivery occurs immediately upon successful payment confirmation from Dodo Payments.
              </li>
              <li>
                <strong>Non-Refundable Nature:</strong> Due to the real-time, competitive digital billboard format where placements are allocated and broadcasted instantly upon payment confirmation, all completed bids are final and non-refundable once published.
              </li>
              <li>
                <strong>Pricing & Currency:</strong> All bids and placement costs are denominated and charged in US Dollars (USD). You are responsible for any foreign transaction or currency conversion fees charged by your card issuer or payment method.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Finality of Bids & No Refunds</h2>
            <p>
              Due to the immediate digital fulfillment and instantaneous broadcast of your link onto the live leaderboard, <strong>all purchases and bids are final and non-refundable once payment is completed</strong>. Please see our full <Link href="/refund-policy" className="text-orange-400 hover:underline">Refund Policy</Link> for complete details.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">6. Limitation of Liability</h2>
            <p>
              The platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We make no guarantees regarding specific web traffic, clicks, conversions, or ranking duration, as rankings depend on competitive user bidding activity.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">7. Contact Information</h2>
            <p>
              For legal inquiries or questions regarding these Terms, contact us at:
              <br />
              <a href="mailto:support@outbids.auction" className="text-orange-400 hover:underline font-medium">
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
