'use client';

/**
 * Category Page
 */

import React from 'react';
import { useParams } from 'next/navigation';
import { Hammer, Car, Home, ShoppingBag, Calculator, Wheat } from 'lucide-react';
import PostFeed from '@/components/posts/PostFeed';
import CategoryNav from '@/components/layout/CategoryNav';
import { CategoryKey, CATEGORY_LABELS } from '@/types';

// Icon mapping
const categoryIcons: Record<string, React.ReactNode> = {
  construction: <Hammer className="w-6 h-6" />,
  auto: <Car className="w-6 h-6" />,
  imobiliare: <Home className="w-6 h-6" />,
  bazar: <ShoppingBag className="w-6 h-6" />,
  contabilitate: <Calculator className="w-6 h-6" />,
  agropiata: <Wheat className="w-6 h-6" />,
};

// Category colors
const categoryColors: Record<string, string> = {
  construction: 'from-orange-500 to-orange-600',
  auto: 'from-blue-500 to-blue-600',
  imobiliare: 'from-green-500 to-green-600',
  bazar: 'from-purple-500 to-purple-600',
  contabilitate: 'from-emerald-500 to-emerald-600',
  agropiata: 'from-lime-500 to-green-600',
};

export default function CategoryPage() {
  const params = useParams();
  const category = params.slug as CategoryKey;
  
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const categoryIcon = categoryIcons[category] || <Hammer className="w-6 h-6" />;
  const categoryColor = categoryColors[category] || 'from-blue-500 to-blue-600';

  return (
    <div className="min-h-screen">
      {/* Category Header - Full-width gradient banner at top (like main page) */}
      <div className={`relative overflow-hidden bg-gradient-to-br ${categoryColor} p-5 md:rounded-2xl md:p-8 md:mx-4 lg:mx-auto lg:max-w-4xl lg:mt-8 text-white`}>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="absolute top-1/2 right-8 w-20 h-20 bg-white/10 rounded-full hidden md:block" />
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-xl flex items-center justify-center">
              {categoryIcon}
            </div>
            <span className="px-2 py-0.5 bg-white/15 backdrop-blur-sm text-[10px] md:text-xs font-medium rounded-full uppercase tracking-wide">
              Categorie
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 tracking-tight">
            {categoryLabel}
          </h1>
          <p className="text-white/80 text-sm md:text-base max-w-lg leading-relaxed">
            Descoperă cele mai noi anunțuri din categoria {categoryLabel.toLowerCase()}
          </p>
        </div>
      </div>

      {/* Category Navigation Bar */}
      <div className="lg:max-w-4xl lg:mx-auto">
        <CategoryNav activeCategory={category} />
      </div>

      <div className="md:max-w-2xl lg:max-w-4xl md:mx-auto md:px-6 lg:px-8 md:py-4">
        {/* Posts Feed */}
        <PostFeed category={category} />
      </div>
    </div>
  );
}
