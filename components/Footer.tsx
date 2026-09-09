import React from 'react';
import Link from 'next/link';
import { Lock, Mail, ShieldAlert } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-16 px-4 bg-white border-t border-gray-100 mt-auto text-gray-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Left Column */}
        <div className="max-w-md">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            About OutBids.auction
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900 tracking-tight">
            A live marketplace for digital visibility.
          </h2>
          <p className="text-xs text-gray-500 flex items-center gap-1.5 pt-1">
            <Lock className="w-3.5 h-3.5 text-[#FF4B4B] shrink-0" />
            <span>Payments securely processed via <strong>Dodo Payments</strong>.</span>
          </p>

          <div className="pt-4">
            <a
              href="https://frogdr.com/outbids.auction?utm_source=outbids.auction"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block hover:opacity-90 transition-opacity"
            >
              <img
                src="https://frogdr.com/outbids.auction/badge-white.svg"
                alt="Monitor your Domain Rating with FrogDR"
                width="250"
                height="54"
                className="w-[200px] sm:w-[220px] h-auto rounded"
              />
            </a>
          </div>
        </div>

        {/* Right Column */}
        <div className="max-w-md text-sm text-gray-600 leading-relaxed space-y-3">
          <p>
            Builders compete with transparent bids, not an opaque algorithm. We fetch public metadata automatically, show verified rank and deduplicated clicks, and keep the rules legible for everyone.
          </p>
          <div className="pt-2 flex items-center gap-4 flex-wrap text-xs">
            <a
              href="mailto:sales@outbids.auction"
              className="inline-flex items-center gap-1.5 font-bold text-[#FF4B4B] hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>sales@outbids.auction</span>
            </a>
            <span className="text-gray-200">|</span>
            <a
              href="mailto:sales@outbids.auction?subject=Abuse%20Report%20-%20outbids.auction&body=Please%20specify%20the%20violating%20listing%20URL%20and%20details%20of%20the%20infringement:"
              className="inline-flex items-center gap-1.5 font-bold text-rose-600 hover:underline"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report Abuse</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-[#d8d0c8] flex flex-col sm:flex-row justify-between items-center text-xs text-[#605850] font-semibold uppercase tracking-wider gap-4">
        <div>OUTBIDS.AUCTION / A LIVE MARKETPLACE FOR DIGITAL VISIBILITY</div>
        <div className="flex items-center gap-5 flex-wrap">
          <Link href="/#rules" className="hover:text-[#c2652a] transition-colors">
            Rules
          </Link>
          <Link href="/history" className="hover:text-[#c2652a] transition-colors">
            My Bids
          </Link>
          <Link href="/terms" className="hover:text-[#c2652a] transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-[#c2652a] transition-colors">
            Privacy
          </Link>
          <Link href="/refunds" className="hover:text-[#c2652a] transition-colors">
            Refunds
          </Link>
          <a
            href="mailto:sales@outbids.auction?subject=Abuse%20Report%20-%20outbids.auction&body=Please%20specify%20the%20violating%20listing%20URL%20and%20details%20of%20the%20infringement:"
            className="hover:text-[#c0392b] text-[#c0392b] transition-colors"
          >
            Report Abuse
          </a>
          <Link href="/contact" className="hover:text-[#c2652a] transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
