import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Mail, Clock, ShieldCheck, HelpCircle, MessageSquare } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact & Support | Outbids.auction',
  description: 'Get in touch with the Outbids.auction support team for assistance, billing, or inquiries.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#08090d] text-gray-200">
      <Navbar showBackHome />

      <main className="container mx-auto px-4 py-12 max-w-4xl flex-1">
        <div className="mb-8 pb-6 border-b border-gray-800 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            Customer Support
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Contact & Support</h1>
          <p className="text-sm text-gray-400 mt-2">
            Have questions about bidding, your placement, or billing? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Card 1: Direct Support Email */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Email Support</h3>
              <p className="text-xs text-gray-400 mt-1">
                Reach our team directly for platform help, link verification, or general questions.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="mailto:support@outbids.auction"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>support@outbids.auction</span>
              </a>
            </div>
          </div>

          {/* Card 2: Billing & Merchant of Record */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Billing & Invoicing</h3>
              <p className="text-xs text-gray-400 mt-1">
                Payments and tax compliance are powered by <strong>Dodo Payments</strong>.
              </p>
            </div>
            <div className="pt-2 text-xs text-gray-400 space-y-1">
              <p>• Invoices generated automatically upon payment</p>
              <p>• Multi-currency global card support</p>
              <p>• Secure 256-bit encrypted checkout</p>
            </div>
          </div>
        </div>

        {/* FAQ Quick Reference */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4 text-sm">
            <div className="glass-card p-4 rounded-xl space-y-1.5">
              <h4 className="font-semibold text-gray-200">How fast does my bid appear on the leaderboard?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Immediately! Once your payment is confirmed by Dodo Payments, our webhook triggers an instant Supabase Realtime broadcast that updates every connected browser live without a refresh.
              </p>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-1.5">
              <h4 className="font-semibold text-gray-200">What is the minimum bid?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                The minimum entry bid is $5.00 USD. You can bid any amount above $5.00 to compete for higher ranks (#1, #2, #3, etc.).
              </p>
            </div>

            <div className="glass-card p-4 rounded-xl space-y-1.5">
              <h4 className="font-semibold text-gray-200">Can I update my website URL after bidding?</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                If you made a typo during submission, please email us at <a href="mailto:support@outbids.auction" className="text-indigo-400 hover:underline">support@outbids.auction</a> with your transaction receipt, and our team will update your link.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
