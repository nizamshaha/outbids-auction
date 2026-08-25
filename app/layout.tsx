import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Outbid | Real-Time Bidding Leaderboard',
  description: 'Outbid the competition to claim the top spots on the live global leaderboard. Real-time updates powered by Supabase & Stripe.',
  openGraph: {
    title: 'Outbid | Real-Time Bidding Leaderboard',
    description: 'Outbid the competition to claim the top spots on the live global leaderboard.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#08090d] text-gray-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white">
        <div className="fixed inset-0 bg-radial-glow pointer-events-none z-0" />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
