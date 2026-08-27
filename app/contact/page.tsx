import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Mail, ShieldCheck, HelpCircle, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Support | Outbids.auction',
  description: 'Get in touch with the Outbids.auction support team for assistance, billing, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1 w-full">
        <div className="mb-10 pb-6 border-b border-outline-variant text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container text-primary border border-outline-variant mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            Customer Support
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-on-surface tracking-tight">
            Contact & Support
          </h1>
          <p className="text-base text-text-muted mt-2">
            Have questions about bidding, your placement, or billing? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Direct Support Email */}
          <div className="bg-surface p-7 rounded-xl border border-outline-variant shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-on-surface">Email Support</h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                Reach our team directly for platform help, link verification, or billing questions.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="mailto:sales@outbids.auction"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white font-semibold text-xs transition-colors shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>sales@outbids.auction</span>
              </a>
            </div>
          </div>

          {/* Card 2: Billing & Dodo Payments Processing */}
          <div className="bg-surface p-7 rounded-xl border border-outline-variant shadow-sm space-y-4">
            <div className="w-10 h-10 rounded-xl bg-surface-container border border-outline-variant flex items-center justify-center text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-display text-on-surface">Secure Payments</h3>
              <p className="text-xs sm:text-sm text-text-muted mt-1 leading-relaxed">
                Transactions and billing security are powered directly by <strong>Dodo Payments</strong>.
              </p>
            </div>
            <div className="pt-2 text-xs text-text-muted space-y-1">
              <p>• Instant order confirmation & receipt via Dodo Payments</p>
              <p>• Major credit cards, debit cards, Apple Pay, and Google Pay accepted</p>
              <p>• 256-bit encrypted checkout protection</p>
            </div>
          </div>
        </div>

        {/* FAQ Quick Reference */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-on-surface flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <h4 className="font-bold text-lg font-display text-on-surface">
                How fast does my bid appear on the leaderboard?
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">
                Immediately! Once your payment is captured by Dodo Payments, our server marks your bid as paid and Supabase Realtime broadcasts the update to every connected browser live without a refresh.
              </p>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <h4 className="font-bold text-lg font-display text-on-surface">
                What is the minimum bid?
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">
                The minimum entry bid is just $1.00 USD (or Free $0 Tier). You can bid any amount equal to or above $1.00 to compete for higher ranks (#1, #2, #3, etc.).
              </p>
            </div>

            <div className="bg-surface p-6 rounded-xl border border-outline-variant shadow-sm space-y-2">
              <h4 className="font-bold text-lg font-display text-on-surface">
                Can I update my website URL after bidding?
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">
                If you made a typo during submission, please email us at <a href="mailto:sales@outbids.auction" className="text-primary font-semibold hover:underline">sales@outbids.auction</a> with your Payment Reference ID, and our team will update your link.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
