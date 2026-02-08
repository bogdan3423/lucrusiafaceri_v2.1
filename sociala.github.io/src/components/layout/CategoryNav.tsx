'use client';

/**
 * CategoryNav - Horizontal scrollable category navigation bar
 * Reusable across feed page and category pages
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Hammer, Car, Home, ShoppingBag, Calculator, Wheat, LayoutGrid } from 'lucide-react';
import { CATEGORIES, CategoryKey } from '@/types';

// Icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  construction: <Hammer className="w-5 h-5" />,
  auto: <Car className="w-5 h-5" />,
  imobiliare: <Home className="w-5 h-5" />,
  bazar: <ShoppingBag className="w-5 h-5" />,
  contabilitate: <Calculator className="w-5 h-5" />,
  agropiata: <Wheat className="w-5 h-5" />,
};

// Category gradient backgrounds
const categoryGradients: Record<string, string> = {
  construction: 'from-orange-500 to-orange-600',
  auto: 'from-blue-500 to-blue-600',
  imobiliare: 'from-green-500 to-green-600',
  bazar: 'from-purple-500 to-purple-600',
  contabilitate: 'from-emerald-500 to-emerald-600',
  agropiata: 'from-lime-500 to-green-600',
};

interface CategoryNavProps {
  activeCategory?: CategoryKey | null;
}

export default function CategoryNav({ activeCategory }: CategoryNavProps) {
  const pathname = usePathname();

  // Determine active category from props or from URL
  const currentCategory = activeCategory ?? (() => {
    const match = pathname.match(/^\/categorie\/(.+)$/);
    return match ? (match[1] as CategoryKey) : null;
  })();

  const allItems = [
    { key: 'all' as const, label: 'Toate' },
    ...CATEGORIES,
  ];

  return (
    <div className="bg-white border-b border-gray-100 md:rounded-xl md:border md:shadow-sm md:mb-4">
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 p-2 sm:p-3">
        {allItems.map((item) => {
          const isAll = item.key === 'all';
          const isActive = isAll ? !currentCategory : currentCategory === item.key;
          const icon = isAll
            ? <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6" />
            : categoryIcons[item.key];
          const activeClass = isAll
            ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-600/20'
            : `bg-gradient-to-br ${categoryGradients[item.key]} text-white shadow-sm ring-1 ring-black/5`;
          const inactiveClass = 'bg-gray-50 text-gray-600 hover:bg-gray-100 ring-1 ring-gray-200/60';

          return (
            <Link
              key={item.key}
              href={isAll ? '/' : `/categorie/${item.key}`}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 sm:py-3 rounded-xl text-center transition-all ${
                isActive ? activeClass : inactiveClass
              }`}
            >
              {icon}
              <span className="text-[10px] sm:text-xs font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
