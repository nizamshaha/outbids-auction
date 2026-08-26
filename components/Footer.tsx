import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full border-t border-gray-900 bg-gray-950/80 pt-12 pb-8 mt-auto">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 text-xs">
          {/* Col 1: About */}
          <div className="space-y-3 md:col-span-2">
            <h5 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              OUTBIDS<span className="text-orange-500">.AUCTION</span>
            </h5>
            <p className="text-gray-400 leading-relaxed max-w-sm">
              The premier live real-time digital billboard. Outbid other websites and products to claim top placement and gain immediate global exposure.
            </p>
            <div className="flex items-center gap-2 text-gray-400 pt-1">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Payments securely processed via <strong>Dodo Payments</strong>.</span>
            </div>
          </div>

          {/* Col 2: Navigation & Product */}
          <div className="space-y-2.5">
            <h6 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">Platform</h6>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/#rules" className="hover:text-orange-400 transition-colors">
                  Simple Rules
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-orange-400 transition-colors">
                  Contact & Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal Compliance */}
          <div className="space-y-2.5">
            <h6 className="font-bold text-gray-200 uppercase tracking-wider text-[11px]">Legal & Policies</h6>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/terms" className="hover:text-orange-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-orange-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-orange-400 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <a
                  href="mailto:support@outbids.auction"
                  className="inline-flex items-center gap-1 text-orange-400 hover:underline"
                >
                  <Mail className="w-3 h-3" />
                  <span>support@outbids.auction</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-gray-400">
          <p>© {new Date().getFullYear()} Outbids.auction. All rights reserved.</p>
          <div className="flex items-center gap-4 text-gray-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Secure Checkout
            </span>
            <span>•</span>
            <span>Live WebSocket Engine</span>
            <span>•</span>
            <span>Dodo Payments Verified</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
