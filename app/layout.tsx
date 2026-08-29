import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://outbids.auction'),
  title: {
    default: 'Outbids.auction | A live marketplace for digital visibility',
    template: '%s | Outbids.auction',
  },
  description:
    'A live marketplace for digital visibility. New spots start at $1. Outbid the competition to broadcast your website link live.',
  keywords: [
    'digital visibility',
    'live marketplace',
    'digital billboard',
    'bidding leaderboard',
    'website promotion',
    'outbid',
    'live ranking',
  ],
  authors: [{ name: 'Outbids.auction' }],
  creator: 'Outbids.auction',
  icons: {
    icon: [
      { url: '/icon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: '48x48' },
    ],
    shortcut: '/icon.png',
    apple: [
      { url: '/apple-icon.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Outbids.auction | A live marketplace for digital visibility',
    description:
      'A live marketplace for digital visibility. New spots start at $1. Outbid the competition to broadcast your website link live.',
    url: 'https://outbids.auction',
    siteName: 'Outbids.auction',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Outbids.auction - A live marketplace for digital visibility',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Outbids.auction | A live marketplace for digital visibility',
    description:
      'A live marketplace for digital visibility. New spots start at $1. Outbid the competition to broadcast your website link live.',
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-on-surface min-h-screen antialiased selection:bg-primary selection:text-white font-sans">
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
