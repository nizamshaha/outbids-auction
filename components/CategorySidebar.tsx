'use client';

import React from 'react';
import { PLATFORM_CATEGORIES } from '@/types/bid';
import { Sparkles, Tag, ChevronRight, Layers } from 'lucide-react';

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
      <aside className="hidden lg:flex flex-col w-60 xl:w-64 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pr-2 pb-8 text-sm">
        <div className="flex justify-between items-center mb-4 px-2 text-xs font-semibold text-text-muted uppercase tracking-widest">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-primary" />
            Categories
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container border border-outline-variant text-text-muted">
            {PLATFORM_CATEGORIES.length}
          </span>
        </div>

        <nav className="space-y-1">
          {ALL_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
            const count = cat === 'All' ? totalCount : categoryCounts[cat.toLowerCase()] || 0;

            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={`w-full flex justify-between items-center py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-left ${
                  isSelected
                    ? 'bg-surface-container text-text-main font-bold border border-outline-variant'
                    : 'text-text-muted hover:text-text-main hover:bg-surface-container-high'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <span className={`w-4 text-center font-bold ${isSelected ? 'text-primary' : 'text-text-muted'}`}>
                    {cat === 'All' ? '⊞' : '✧'}
                  </span>
                  <span className="truncate">{cat}</span>
                </span>

                {count > 0 && (
                  <span className="text-[11px] text-text-muted font-medium shrink-0 ml-2">
                    {count}
                  </span>
                )}
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

          return (
            <button
              key={cat}
              onClick={() => onSelectCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-surface-container text-text-main font-bold border-primary/40'
                  : 'bg-surface text-text-muted hover:text-text-main border-outline-variant'
              }`}
            >
              <span>{cat === 'All' ? '⊞' : '✧'}</span>
              <span>{cat}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}
