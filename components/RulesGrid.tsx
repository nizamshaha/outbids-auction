import React from 'react';

export function RulesGrid() {
  const rules = [
    {
      num: '01',
      title: 'Dynamic Rankings',
      description:
        'New listings start at $1.00 USD; a higher bid ranks above lower bids, while equal bids keep the earlier verified position.',
    },
    {
      num: '02',
      title: 'Instant Confirmation',
      description:
        'Paid listings verify through Dodo Payments; free listings publish immediately after validation.',
    },
    {
      num: '03',
      title: 'Top-Up Difference',
      description:
        'Use the same normalized URL or @handle to raise its total. You only pay the incremental delta to claim a higher rank.',
    },
    {
      num: '04',
      title: 'Deduplicated Clicks',
      description:
        'Tracked outbound redirects count one anonymous visitor per listing per 24 hours, preventing artificial click inflation.',
    },
  ];

  return (
    <section id="rules" className="bg-surface-container border-y border-outline-variant py-16 md:py-20 px-4 my-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16">
        {/* Left Column: Editorial Headline */}
        <div className="md:w-1/3">
          <div className="text-xs font-bold text-primary uppercase tracking-widest mb-4">
            Rules / How it works
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold mb-2 font-display text-on-surface">
            Straightforward rules.
          </h2>
          <h2 className="text-4xl sm:text-5xl font-bold text-primary mb-6 font-display">
            Transparent results.
          </h2>
          <p className="text-text-muted mb-8 text-base sm:text-lg leading-relaxed">
            Every confirmed bid secures real public placement, governed by open math rather than hidden algorithms.
          </p>
          <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
            01–04 · TRANSPARENT BY DESIGN
          </div>
        </div>

        {/* Right Column: 2x2 Grid of Rules */}
        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {rules.map((rule) => (
            <div
              key={rule.num}
              className="bg-surface p-7 sm:p-8 rounded-xl border border-outline-variant shadow-sm space-y-4"
            >
              <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-display text-lg font-bold border border-primary/20">
                {rule.num}
              </div>
              <h3 className="font-bold text-xl sm:text-2xl font-display text-on-surface">
                {rule.title}
              </h3>
              <p className="text-sm sm:text-base text-text-muted leading-relaxed">
                {rule.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
