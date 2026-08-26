import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://outbids.auction'),
  title: {
    default: 'Outbids.auction | Real-Time Digital Billboard Leaderboard',
    template: '%s | Outbids.auction',
  },
  description:
    'Outbid the competition to broadcast your website link live on the global digital billboard. Real-time WebSocket rankings with instant PayPal checkout.',
  keywords: [
    'digital billboard',
    'bidding leaderboard',
    'real-time auction',
    'website promotion',
    'outbid',
    'live ranking',
  ],
  authors: [{ name: 'Outbids.auction' }],
  creator: 'Outbids.auction',
  openGraph: {
    title: 'Outbids.auction | Real-Time Digital Billboard Leaderboard',
    description:
      'Outbid the competition to broadcast your website link live on the global digital billboard. Real-time WebSocket rankings with instant PayPal checkout.',
    url: 'https://outbids.auction',
    siteName: 'Outbids.auction',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outbids.auction | Real-Time Digital Billboard Leaderboard',
    description:
      'Outbid the competition to broadcast your website link live on the global digital billboard.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090d] text-gray-100 min-h-screen antialiased selection:bg-orange-500 selection:text-white">
        <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
