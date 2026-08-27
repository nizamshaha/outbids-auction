import React from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Mail, ShieldCheck, HelpCircle, MessageSquare, ShieldAlert } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact & Support | Outbids.auction',
  description: 'Get in touch with the Outbids.auction support team for assistance, billing, or abuse reports.',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] font-sans selection:bg-[#c2652a]/20">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 w-full">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-[#d8d0c8] text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#f2ece4] text-[#c2652a] border border-[#d8d0c8] mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            Customer Support & Inquiries
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold font-display text-[#1a1a1a] tracking-tight">
            Contact & Support Center
          </h1>
          <p className="text-base text-[#605850] mt-2 font-medium">
            Have questions about bidding, your placement, technical inquiries, or safety? We are here to help.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: Direct Support Email */}
          <div className="bg-[#faf5ee] p-6 sm:p-7 rounded-2xl border border-[#d8d0c8] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#f2ece4] border border-[#d8d0c8] flex items-center justify-center text-[#c2652a]">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1a1a1a]">General Support</h3>
              <p className="text-xs sm:text-sm text-[#605850] leading-relaxed">
                Reach our team directly for platform help, link verification, or billing questions.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="mailto:sales@outbids.auction"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c2652a] hover:bg-[#c2652a]/90 text-white font-bold text-xs transition-colors shadow-sm w-full justify-center"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>sales@outbids.auction</span>
              </a>
            </div>
          </div>

          {/* Card 2: Report Abuse */}
          <div className="bg-[#faf5ee] p-6 sm:p-7 rounded-2xl border border-[#c0392b]/30 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#fce4e0] border border-[#c0392b]/30 flex items-center justify-center text-[#c0392b]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1a1a1a]">Report Abuse</h3>
              <p className="text-xs sm:text-sm text-[#605850] leading-relaxed">
                Report trademark infringement, malware, scam URLs, or prohibited content.
              </p>
            </div>
            <div className="pt-2">
              <a
                href="mailto:sales@outbids.auction?subject=Abuse%20Report%20-%20outbids.auction&body=Please%20specify%20the%20violating%20listing%20URL%20and%20details%20of%20the%20infringement:"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#c0392b] hover:bg-[#c0392b]/90 text-white font-bold text-xs transition-colors shadow-sm w-full justify-center"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Report Abuse</span>
              </a>
            </div>
          </div>

          {/* Card 3: Secure Payments */}
          <div className="bg-[#faf5ee] p-6 sm:p-7 rounded-2xl border border-[#d8d0c8] shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#f2ece4] border border-[#d8d0c8] flex items-center justify-center text-[#c2652a]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-[#1a1a1a]">Secure Payments</h3>
              <p className="text-xs sm:text-sm text-[#605850] leading-relaxed">
                Transactions and billing security are powered directly by <strong>Dodo Payments</strong>.
              </p>
            </div>
            <div className="pt-2 text-xs text-[#605850] space-y-1">
              <p>• Instant receipt confirmation</p>
              <p>• 256-bit PCI-DSS compliance</p>
            </div>
          </div>
        </div>

        {/* FAQ Quick Reference */}
        <div className="space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-[#1a1a1a] flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#c2652a]" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <div className="bg-[#faf5ee] p-6 rounded-2xl border border-[#d8d0c8] shadow-sm space-y-2">
              <h4 className="font-bold text-lg font-display text-[#1a1a1a]">
                How fast does my bid appear on the leaderboard?
              </h4>
              <p className="text-sm text-[#605850] leading-relaxed">
                Immediately! Once your payment is captured by Dodo Payments, our server marks your bid as paid and Supabase Realtime broadcasts the update to every connected browser live without a refresh.
              </p>
            </div>

            <div className="bg-[#faf5ee] p-6 rounded-2xl border border-[#d8d0c8] shadow-sm space-y-2">
              <h4 className="font-bold text-lg font-display text-[#1a1a1a]">
                What is the refund policy?
              </h4>
              <p className="text-sm text-[#605850] leading-relaxed">
                Because digital visibility is delivered instantaneously upon payment capture, all processed bids are strictly final and non-refundable. Please view our{' '}
                <Link href="/refunds" className="text-[#c2652a] font-bold hover:underline">
                  Refund Policy
                </Link>{' '}
                for full details.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
