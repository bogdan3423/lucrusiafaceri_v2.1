'use client';

/**
 * Category Page
 */

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Hammer, Car, Home, ShoppingBag, Calculator, Wheat } from 'lucide-react';
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
      {/* Category Navigation Bar */}
      <CategoryNav activeCategory={category} />

      <div className="md:max-w-2xl lg:max-w-4xl md:mx-auto md:px-6 lg:px-8 md:py-8">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-gray-600 hover:text-blue-600 px-3 py-3 md:px-0 md:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Înapoi la feed</span>
        </Link>

        {/* Category Header - Full-width on mobile */}
        <div className={`bg-gradient-to-r ${categoryColor} md:rounded-xl p-4 md:p-6 mb-2 md:mb-8 text-white`}>
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 rounded-xl flex items-center justify-center">
              {categoryIcon}
            </div>
            <div>
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">{categoryLabel}</h1>
              <p className="text-white/80 mt-1 text-sm md:text-base">
                Descoperă cele mai noi anunțuri din categoria {categoryLabel.toLowerCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <PostFeed category={category} />
      </div>
    </div>
  );
}
