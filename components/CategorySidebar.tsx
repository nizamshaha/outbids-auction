'use client';

import React from 'react';
import { PLATFORM_CATEGORIES } from '@/types/bid';
import { Tag, Sparkles, Layers, ChevronRight } from 'lucide-react';

interface CategorySidebarProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  categoryCounts?: Record<string, number>;
  totalCount?: number;
}

const ALL_CATEGORIES = ['All', ...PLATFORM_CATEGORIES];

export function CategorySidebar({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
  totalCount = 0,
}: CategorySidebarProps) {
  return (
    <>
      {/* ----------------------------------------------------------- */}
      {/* 1. DESKTOP PINNED ASIDE SIDEBAR (lg:block)                   */}
      {/* ----------------------------------------------------------- */}
      <aside className="hidden lg:flex flex-col w-64 xl:w-72 sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-850 space-y-3 pb-8">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gray-300">
            <Layers className="w-4 h-4 text-orange-400" />
            <span>Categories</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-gray-400">
            {PLATFORM_CATEGORIES.length} Tags
          </span>
        </div>

        <div className="space-y-1">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count = cat === 'All' ? totalCount : categoryCounts[cat.toLowerCase()] || 0;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer group ${
                  isSelected
                    ? 'bg-orange-500 text-black font-extrabold shadow-md shadow-orange-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-900/80'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  {cat === 'All' ? (
                    <Sparkles className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-orange-400'}`} />
                  ) : (
                    <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-black' : 'text-gray-500 group-hover:text-orange-400 transition-colors'}`} />
                  )}
                  <span className="truncate">{cat}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {count > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                        isSelected
                          ? 'bg-black/20 text-black'
                          : 'bg-gray-900 text-gray-400 group-hover:text-gray-300'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${
                      isSelected ? 'text-black translate-x-0.5' : 'text-gray-600 opacity-0 group-hover:opacity-100'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ----------------------------------------------------------- */}
      {/* 2. MOBILE HORIZONTAL SCROLLABLE RAIL (lg:hidden)            */}
      {/* ----------------------------------------------------------- */}
      <div className="lg:hidden w-full overflow-x-auto pb-3 scrollbar-none flex items-center gap-1.5 text-xs">
        {ALL_CATEGORIES.map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-orange-500 text-black font-extrabold shadow-md shadow-orange-500/20'
                  : 'bg-gray-900/90 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
              }`}
            >
              <Tag className="w-3 h-3 text-orange-400/80" />
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
