import React from 'react';
import { Flame, DollarSign, Zap, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export function RulesGrid() {
  const rules = [
    {
      icon: Flame,
      title: 'Digital Billboard',
      description: 'Your submitted website URL is showcased publicly with a verified, clickable link.',
      color: 'text-orange-400',
      bg: 'bg-orange-500/10 border-orange-500/20',
    },
    {
      icon: DollarSign,
      title: 'Pay-As-You-Bid ($1 Min)',
      description: 'Entry bids start at just $1.00 USD. Place any amount higher to outrank competitor sites.',
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      icon: Zap,
      title: 'Dynamic Re-Ranking',
      description: 'When another user places a higher bid, positions recalculate live in real-time.',
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      icon: Clock,
      title: 'Instant Live Broadcast',
      description: 'The moment your payment clears, our WebSocket engine broadcasts your link to all viewers.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      icon: AlertTriangle,
      title: 'Finality & No Refunds',
      description: 'Because placements are fulfilled digitally and broadcasted immediately, all bids are final.',
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      icon: ShieldCheck,
      title: 'Brand Safe & Verified',
      description: 'Malware, phishing, and illegal domains are strictly prohibited and removed without notice.',
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10 border-cyan-500/20',
    },
  ];

  return (
    <section id="rules" className="w-full my-12 pt-8 border-t border-gray-900">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-black text-white">Simple Rules</h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto">
          Everything you need to know about placing bids and ranking on Outbids.auction.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rules.map((rule, idx) => {
          const Icon = rule.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-gray-800/80 bg-gray-950/60 hover:bg-gray-900/60 transition-all space-y-2.5"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${rule.bg}`}>
                <Icon className={`w-4 h-4 ${rule.color}`} />
              </div>
              <h3 className="font-bold text-sm text-white">{rule.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{rule.description}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
