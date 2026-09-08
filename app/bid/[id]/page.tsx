import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/utils/supabase/admin';
import { sanitizeAndNormalizeUrl } from '@/utils/formatters';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { BidListingView } from '@/components/BidListingView';
import { Bid } from '@/types/bid';
import { ArrowLeft, AlertCircle, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: {
    id: string;
  };
}

/**
 * Fetches the bid and computes its current live rank against all paid bids in Supabase.
 */
async function getBidAndRank(id: string): Promise<{ bid: Bid; rank: number } | null> {
  try {
    if (!id || typeof id !== 'string') return null;

    const supabase = createAdminClient();

    // 1. Fetch the target bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (bidError || !bid) {
      return null;
    }

    // 2. Fetch all paid bids to calculate deterministic live rank
    let rank = 1;
    if (bid.status === 'paid') {
      const { data: allPaidBids, error: rankError } = await supabase
        .from('bids')
        .select('id, amount, created_at, status')
        .eq('status', 'paid')
        .order('amount', { ascending: false })
        .order('created_at', { ascending: true });

      if (!rankError && allPaidBids && allPaidBids.length > 0) {
        // Deterministic sort: highest amount first, earlier created_at on ties
        const sorted = [...allPaidBids].sort((a, b) => {
          if (b.amount !== a.amount) {
            return b.amount - a.amount;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        const rankIndex = sorted.findIndex((item) => item.id === bid.id);
        rank = rankIndex !== -1 ? rankIndex + 1 : sorted.length + 1;
      }
    } else {
      rank = 0; // Not currently placed on active paid leaderboard
    }

    return { bid: bid as Bid, rank };
  } catch (err) {
    console.error(`[Outbids] Error fetching bid [${id}]:`, err);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const result = await getBidAndRank(params.id);

  if (!result) {
    return {
      title: 'Spotlight Listing Not Found | Outbids.auction',
      description: 'The requested listing could not be found on the live Outbids digital visibility leaderboard.',
      robots: { index: false, follow: true },
    };
  }

  const { bid, rank } = result;
  const { displayDomain } = sanitizeAndNormalizeUrl(bid.url);
  const displayName = bid.title?.trim() || displayDomain || 'Featured Listing';
  const effectiveRank = rank > 0 ? rank : 1;

  const title = `Rank #${effectiveRank} - ${displayName} on Outbids!`;
  const description = `I just secured the #${effectiveRank} spot on the live digital visibility board. Outbid me if you can.`;
  const pageUrl = `https://outbids.auction/bid/${bid.id}`;
  const ogImage = bid.icon_url || 'https://outbids.auction/opengraph-image';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'Outbids.auction',
      locale: 'en_US',
      type: 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${displayName} - Rank #${effectiveRank} on Outbids`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function BidDetailPage({ params }: PageProps) {
  const result = await getBidAndRank(params.id);

  if (!result) {
    return (
      <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] font-sans selection:bg-[#c2652a]/20">
        <Navbar showBackHome />
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-20 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-3xl bg-[#fce4e0] border border-[#c0392b]/30 flex items-center justify-center text-[#c0392b] mb-6 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold font-display text-[#1a1a1a] mb-3">
            Listing Not Found
          </h1>
          <p className="text-sm sm:text-base text-[#605850] max-w-md mb-8 leading-relaxed">
            This listing either expired, is still processing payment, or has been removed from the live visibility board.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#c2652a] hover:bg-[#c2652a]/90 text-white font-bold text-sm transition-colors shadow-sm"
            >
              <Zap className="w-4 h-4" />
              <span>Explore Live Leaderboard</span>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const { bid, rank } = result;

  return (
    <div className="min-h-screen flex flex-col bg-[#faf5ee] text-[#1a1a1a] font-sans selection:bg-[#c2652a]/20">
      <Navbar showBackHome />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex-1 w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#605850] hover:text-[#c2652a] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </Link>

          <span className="text-xs text-[#605850] font-medium">
            Live Spotlight Listing
          </span>
        </div>

        {/* Dynamic Spotlight View */}
        <BidListingView bid={bid} rank={rank} />
      </main>

      <Footer />
    </div>
  );
}
