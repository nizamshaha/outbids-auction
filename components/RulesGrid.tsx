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
    <section id="rules" className="bg-white border-y border-gray-100 py-16 md:py-20 px-4 my-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-12 md:gap-16">
        {/* Left Column: Headline */}
        <div className="md:w-1/3">
          <div className="text-xs font-bold text-[#FF4B4B] uppercase tracking-widest mb-3">
            Rules / How it works
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-1 text-gray-950 tracking-tight">
            Straightforward rules.
          </h2>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#FF4B4B] mb-5 tracking-tight">
            Transparent results.
          </h2>
          <p className="text-gray-500 mb-8 text-sm sm:text-base leading-relaxed">
            Every confirmed bid secures real public placement, governed by open math rather than hidden algorithms.
          </p>
          <div className="text-xs font-mono text-gray-400 uppercase tracking-widest">
            01–04 · TRANSPARENT BY DESIGN
          </div>
        </div>

        {/* Right Column: 2x2 Grid of Rules */}
        <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {rules.map((rule) => (
            <div
              key={rule.num}
              className="bg-white p-6 sm:p-7 rounded-xl border border-gray-100 shadow-2xs space-y-3"
            >
              <div className="w-9 h-9 rounded-full bg-[#FFF5F3] text-[#FF4B4B] flex items-center justify-center font-mono text-sm font-bold border border-[#FFE4E0]">
                {rule.num}
              </div>
              <h3 className="font-bold text-lg sm:text-xl text-gray-900">
                {rule.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {rule.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
