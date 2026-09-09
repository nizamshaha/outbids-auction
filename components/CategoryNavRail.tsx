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

export const CATEGORY_SHORT_LABEL: Record<string, string> = {
  All: 'All',
  'SEO & AI Visibility': 'AI & SEO',
  'AI Agents & Infrastructure': 'AI Agents',
  'AI Media Generation': 'AI Media',
  'Developer Tools': 'Developer',
  'Productivity & Personal Tools': 'Productivity',
  'Writing & Content': 'Writing',
  'People & Profiles': 'People',
  'Directories, Launch & Discovery': 'Directories',
  'Design & Creative': 'Design',
  'Agencies, Studios & Services': 'Agencies',
  'Marketing & Advertising': 'Marketing',
  'Social Media & Creator Tools': 'Social',
  'Education & Learning': 'Education',
  'Sales & Lead Generation': 'Sales',
  'Travel, Local & Lifestyle': 'Travel',
  'Crypto, Web3 & Investing': 'Crypto & Web3',
  'Domains & Web Assets': 'Domains',
  'Health, Fitness & Wellness': 'Health',
  'Leaderboards & Attention Markets': 'Leaderboards',
  'Media & News': 'Media',
  'Business, Finance & Legal': 'Finance',
  'Ecommerce & Retail': 'Ecommerce',
  'Hiring, Jobs & Careers': 'Careers',
  'Audio, Voice & Podcasting': 'Audio',
  'Security, Privacy & Compliance': 'Security',
  'Real Estate & Property': 'Real Estate',
  'Games & Entertainment': 'Gaming',
  Other: 'Other',
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
    <div className="relative w-full bg-white border-b border-gray-100 py-2.5">
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-1.5">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={() => scroll('left')}
          className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-500 transition-colors shrink-0 cursor-pointer shadow-2xs"
          title="Scroll categories left"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        {/* Scrollable Category Rail */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 scroll-smooth w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const Icon = CATEGORY_ICON_MAP[cat] || Tag;
            const displayLabel = CATEGORY_SHORT_LABEL[cat] || cat;
            const count = cat.toLowerCase() === 'all'
              ? undefined
              : categoryCounts[cat.toLowerCase()];

            return (
              <button
                key={cat}
                type="button"
                onClick={() => handleSelect(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-[#FF4B4B] text-white border-[#FF4B4B] shadow-xs'
                    : 'bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 border-gray-200'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                <span>{displayLabel}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full tabular-nums ${
                      isSelected
                        ? 'bg-white/25 text-white'
                        : 'bg-gray-100 text-gray-500'
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
          className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full border border-gray-200 bg-white hover:bg-gray-100 text-gray-500 transition-colors shrink-0 cursor-pointer shadow-2xs"
          title="Scroll categories right"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
