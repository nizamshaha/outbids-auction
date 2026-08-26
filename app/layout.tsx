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
  icons: {
    icon: [
      { url: '/assets/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/assets/icon.png',
    apple: [
      { url: '/assets/icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Outbids.auction | Real-Time Digital Billboard Leaderboard',
    description:
      'Outbid the competition to broadcast your website link live on the global digital billboard. Real-time WebSocket rankings with instant PayPal checkout.',
    url: 'https://outbids.auction',
    siteName: 'Outbids.auction',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Outbids.auction - Real-Time Digital Billboard Leaderboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outbids.auction | Real-Time Digital Billboard Leaderboard',
    description:
      'Outbid the competition to broadcast your website link live on the global digital billboard.',
    images: ['/opengraph-image'],
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
