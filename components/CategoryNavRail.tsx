'use client';

import React, { useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
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
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

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

interface CategoryNavRailProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
}

export function CategoryNavRail({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}: CategoryNavRailProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const categories = ['All', ...PLATFORM_CATEGORIES];

  const handleSelect = (category: string) => {
    onSelectCategory(category);

    // Sync with Next.js URL search params cleanly without full-page reloads
    const params = new URLSearchParams(searchParams.toString());
    if (category.toLowerCase() === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full my-4">
      <div className="flex items-center gap-1.5">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg border border-[#d8d0c8] bg-white hover:bg-neutral-100 text-neutral-600 transition-colors shrink-0 cursor-pointer shadow-2xs"
          title="Scroll categories left"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Category Rail */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 scroll-smooth w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const Icon = CATEGORY_ICON_MAP[cat] || Tag;
            const count = cat.toLowerCase() === 'all'
              ? undefined
              : categoryCounts[cat.toLowerCase()];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelect(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-neutral-900 text-white border-neutral-900 shadow-2xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border-[#d8d0c8]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-neutral-500'}`} />
                <span>{cat}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                      isSelected
                        ? 'bg-neutral-800 text-neutral-300'
                        : 'bg-neutral-100 text-neutral-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={() => scroll('right')}
          className="hidden sm:flex items-center justify-center w-7 h-7 rounded-lg border border-[#d8d0c8] bg-white hover:bg-neutral-100 text-neutral-600 transition-colors shrink-0 cursor-pointer shadow-2xs"
          title="Scroll categories right"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
