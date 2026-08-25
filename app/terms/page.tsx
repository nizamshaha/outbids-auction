import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
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
              <li>Bidding starts at a minimum of $5.00 USD.</li>
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
              We reserve the right to review and remove any URL violating these guidelines without liability.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">4. Payment Processing & Merchant of Record</h2>
            <p>
              Our order process is conducted by our online reseller and Merchant of Record, <strong>Dodo Payments</strong>. Dodo Payments handles all customer service inquiries, billing compliance, invoicing, and applicable regional sales tax collections.
            </p>
            <p>
              By completing a transaction, you authorize Dodo Payments to charge your selected payment method for the bid amount specified.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">5. Finality of Bids & No Refunds</h2>
            <p>
              Due to the immediate digital fulfillment and instantaneous broadcast of your link onto the live leaderboard, <strong>all purchases and bids are final and non-refundable once payment is completed</strong>. Please see our full <a href="/refund" className="text-indigo-400 hover:underline">Refund Policy</a> for complete details.
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
