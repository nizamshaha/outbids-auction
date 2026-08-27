import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface NavbarProps {
  showBackHome?: boolean;
}

export function Navbar({ showBackHome = false }: NavbarProps) {
  return (
    <header className="border-b border-[#d8d0c8] sticky top-0 bg-[#faf5ee]/90 backdrop-blur-md z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between text-sm">
        <Link href="/" className="font-bold text-xl flex items-center gap-2 font-display">
          <span className="text-[#c2652a] tracking-tight">OutBids.auction</span>
        </Link>

        <div className="flex items-center gap-6 text-xs font-semibold uppercase tracking-wider">
          {showBackHome ? (
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d8d0c8] bg-[#f2ece4] hover:bg-[#ece6dc] text-[#1a1a1a] transition-colors font-bold"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Billboard</span>
            </Link>
          ) : (
            <nav className="hidden sm:flex items-center gap-6 text-[#605850]">
              <Link href="/#rules" className="hover:text-[#c2652a] transition-colors">
                Rules
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
              <Link
                href="/contact"
                className="px-3.5 py-1.5 rounded-lg bg-[#c2652a] text-white hover:bg-[#c2652a]/90 transition-colors font-bold shadow-sm"
              >
                Support
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  );
}
