import React from 'react';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="py-16 px-4 bg-background border-t border-outline-variant mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
        {/* Left Column */}
        <div className="max-w-md">
          <div className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
            About OutBids.auction
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 font-display text-on-surface">
            A live marketplace for digital visibility.
          </h2>
          <p className="text-xs text-text-muted flex items-center gap-1.5 pt-2">
            <Lock className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Payments securely processed via <strong>Dodo Payments</strong>.</span>
          </p>
        </div>

        {/* Right Column */}
        <div className="max-w-md text-sm sm:text-base text-text-muted leading-relaxed space-y-4">
          <p>
            Builders compete with transparent bids, not an opaque algorithm. We fetch public metadata automatically, show verified rank and deduplicated clicks, and keep the rules legible for everyone.
          </p>
          <div className="pt-2">
            <a
              href="mailto:sales@outbids.auction"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>sales@outbids.auction</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-14 pt-8 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center text-xs text-text-muted font-semibold uppercase tracking-wider gap-4">
        <div>OUTBIDS.AUCTION / A LIVE MARKETPLACE FOR DIGITAL VISIBILITY</div>
        <div className="flex items-center gap-5 flex-wrap">
          <Link href="/#rules" className="hover:text-primary transition-colors">
            Rules
          </Link>
          <Link href="/terms" className="hover:text-primary transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">
            Privacy
          </Link>
          <Link href="/refund-policy" className="hover:text-primary transition-colors">
            Refunds
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Support
          </Link>
        </div>
      </div>
    </footer>
  );
}
