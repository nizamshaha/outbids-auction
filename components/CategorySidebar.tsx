'use client';

import React from 'react';
import { PLATFORM_CATEGORIES } from '@/types/bid';
import {
  Layers,
  Search,
  Bot,
  Sparkles,
  Code2,
  CheckSquare,
  PenSquare,
  User,
  Compass,
  Palette,
  Briefcase,
  Megaphone,
  Share2,
  GraduationCap,
  Target,
  Plane,
  Coins,
  Globe,
  HeartPulse,
  Trophy,
  Newspaper,
  Scale,
  ShoppingBag,
  Users,
  Mic,
  ShieldCheck,
  Building2,
  Gamepad2,
  Tag,
  LucideIcon,
} from 'lucide-react';

export interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryPools?: Record<string, number>; // volume in USD dollars
  categoryCounts?: Record<string, number>; // active listing count
  totalPoolDollars?: number;
  totalCount?: number;
  metricType?: 'volume' | 'count';
}

// 1. Explicit semantic Lucide icon mappings for all 29 categories
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  All: Layers,
  'SEO & AI Visibility': Search,
  'AI Agents & Infrastructure': Bot,
  'AI Media Generation': Sparkles,
  'Developer Tools': Code2,
  'Productivity & Personal Tools': CheckSquare,
  'Writing & Content': PenSquare,
  'People & Profiles': User,
  'Directories, Launch & Discovery': Compass,
  'Design & Creative': Palette,
  'Agencies, Studios & Services': Briefcase,
  'Marketing & Advertising': Megaphone,
  'Social Media & Creator Tools': Share2,
  'Education & Learning': GraduationCap,
  'Sales & Lead Generation': Target,
  'Travel, Local & Lifestyle': Plane,
  'Crypto, Web3 & Investing': Coins,
  'Domains & Web Assets': Globe,
  'Health, Fitness & Wellness': HeartPulse,
  'Leaderboards & Attention Markets': Trophy,
  'Media & News': Newspaper,
  'Business, Finance & Legal': Scale,
  'Ecommerce & Retail': ShoppingBag,
  'Hiring, Jobs & Careers': Users,
  'Audio, Voice & Podcasting': Mic,
  'Security, Privacy & Compliance': ShieldCheck,
  'Real Estate & Property': Building2,
  'Games & Entertainment': Gamepad2,
  Other: Tag,
};

export const ALL_CATEGORIES = ['All', ...PLATFORM_CATEGORIES];

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  categoryPools = {},
  categoryCounts = {},
  totalPoolDollars = 0,
  totalCount = 0,
  metricType = 'volume',
}: CategorySidebarProps) {
  /**
   * Formats the right-aligned metric value with explicit $ symbol for monetary amounts
   * and clean numeric formatting for counts.
   */
  const formatMetric = (cat: string): { full: string; short: string } => {
    const key = cat.toLowerCase();

    if (metricType === 'count') {
      const rawCount = (cat === 'All' ? totalCount : categoryCounts[key]) ?? 0;
      const safeCount = isNaN(Number(rawCount)) ? 0 : Number(rawCount);
      const formatted = safeCount.toLocaleString();
      return {
        full: `— ${formatted}`,
        short: formatted,
      };
    }

    // Default: Monetary Volume / Pricing ($)
    const rawDollars = (cat === 'All' ? totalPoolDollars : categoryPools[key]) ?? 0;
    const safeDollars = isNaN(Number(rawDollars)) ? 0 : Number(rawDollars);
    const formatted = `$${safeDollars.toLocaleString()}`;
    return {
      full: `— ${formatted}`,
      short: formatted,
    };
  };

  return (
    <>
      {/* ----------------------------------------------------------- */}
      {/* 1. DESKTOP STICKY VERTICAL SIDEBAR (lg:flex)                 */}
      {/* ----------------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 pb-8 text-sm scrollbar-thin">
        {/* Header Label & Total Count Pill */}
        <div className="flex justify-between items-center mb-3 px-2 text-xs font-semibold text-text-muted uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Market Taxonomy
          </span>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant text-text-muted">
            {ALL_CATEGORIES.length}
          </span>
        </div>

        {/* Categories List */}
        <nav className="space-y-0.5" aria-label="Category Navigation">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const Icon = CATEGORY_ICON_MAP[cat] || Tag;
            const { full: fullMetricDisplay } = formatMetric(cat);

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex justify-between items-center py-2 px-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer text-left group ${
                  isSelected
                    ? 'bg-surface-container text-text-main font-bold shadow-xs border border-outline-variant'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-container-high/60 border border-transparent'
                }`}
              >
                {/* Left: Semantic Lucide Icon + Category Label */}
                <span className="flex items-center gap-2.5 truncate min-w-0 pr-2">
                  <Icon
                    className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                      isSelected
                        ? 'text-primary'
                        : 'text-text-muted/70 group-hover:text-text-main'
                    }`}
                  />
                  <span className="truncate tracking-tight">{cat}</span>
                </span>

                {/* Right: Data-Dense Aligned Metric (— $131 / — $0) */}
                <span
                  className={`text-[11px] font-mono shrink-0 whitespace-nowrap tabular-nums tracking-tighter ${
                    isSelected
                      ? 'text-primary font-bold'
                      : 'text-text-muted/60 group-hover:text-text-muted'
                  }`}
                >
                  {fullMetricDisplay}
                </span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* ----------------------------------------------------------- */}
      {/* 2. MOBILE HORIZONTAL SCROLLABLE RAIL (lg:hidden)            */}
      {/* ----------------------------------------------------------- */}
      <div className="lg:hidden w-full overflow-x-auto pb-3 scrollbar-none flex items-center gap-2 text-xs">
        {ALL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
          const Icon = CATEGORY_ICON_MAP[cat] || Tag;
          const { short: shortMetricDisplay } = formatMetric(cat);

          return (
            <button
              key={cat}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-surface-container text-text-main font-bold border-primary/40 shadow-xs'
                  : 'bg-surface text-text-muted hover:text-text-main border-outline-variant hover:bg-surface-container-high'
              }`}
            >
              <Icon
                className={`w-3 h-3 ${isSelected ? 'text-primary' : 'text-text-muted'}`}
              />
              <span>{cat}</span>
              <span className="text-[10px] font-mono text-text-muted/80 tabular-nums">
                {shortMetricDisplay}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
