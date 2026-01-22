'use client';

/**
 * Home Page - Main Feed
 */

import React from 'react';
import Link from 'next/link';
import { PlusCircle, Hammer, Car, Home, ShoppingBag, Calculator, Wheat } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import PostFeed from '@/components/posts/PostFeed';
import { CATEGORIES } from '@/types';

// Icon mapping with gradient backgrounds
const categoryStyles: Record<string, { icon: React.ReactNode; gradient: string }> = {
  construction: { 
    icon: <Hammer className="w-5 h-5 text-white" />, 
    gradient: 'bg-gradient-to-br from-blue-500 to-blue-700' 
  },
  auto: { 
    icon: <Car className="w-5 h-5 text-white" />, 
    gradient: 'bg-gradient-to-br from-orange-400 to-orange-600' 
  },
  imobiliare: { 
    icon: <Home className="w-5 h-5 text-white" />, 
    gradient: 'bg-gradient-to-br from-yellow-400 to-amber-500' 
  },
  bazar: { 
    icon: <ShoppingBag className="w-5 h-5 text-white" />, 
    gradient: 'bg-gradient-to-br from-orange-500 to-red-500' 
  },
  contabilitate: { 
    icon: <Calculator className="w-5 h-5 text-white" />, 
    gradient: 'bg-gradient-to-br from-green-400 to-emerald-600' 
  },
  agropiata: { 
    icon: <Wheat className="w-5 h-5 text-white" />, 
    gradient: 'bg-gradient-to-br from-lime-400 to-green-600' 
  },
};

export default function HomePage() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Mobile: Full-width immersive feed */}
      {/* Desktop: Centered layout with sidebar */}
      <div className="lg:max-w-7xl lg:mx-auto lg:px-8 lg:py-8">
        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Sidebar - Hidden on mobile, visible on desktop */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24">
              <h2 className="text-sm font-semibold text-blue-500 uppercase tracking-wide mb-5">Categorii</h2>
              <nav className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.key}
                    href={`/categorie/${cat.key}`}
                    className="flex items-center space-x-4 px-2 py-2.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all group"
                  >
                    <div className={`w-11 h-11 rounded-full ${categoryStyles[cat.key]?.gradient} flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all`}>
                      {categoryStyles[cat.key]?.icon}
                    </div>
                    <span className="font-medium text-gray-800 group-hover:text-gray-900">{cat.label}</span>
                  </Link>
                ))}
              </nav>

              {/* Add Post CTA */}
              {!loading && user && (
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <Link
                    href="/postare-noua"
                    className="flex items-center justify-center space-x-2 w-full px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>Adaugă anunț</span>
                  </Link>
                </div>
              )}
            </div>
          </aside>

          {/* Main Content - Feed */}
          <div className="lg:col-span-3">
            {/* Welcome Banner - Enhanced design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-5 md:rounded-2xl md:p-8 md:mx-4 lg:mx-0 mb-2 md:mb-6 text-white">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="absolute top-1/2 right-8 w-20 h-20 bg-blue-400/10 rounded-full hidden md:block" />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl md:text-3xl"></span>
                  <span className="px-2 py-0.5 bg-white/15 backdrop-blur-sm text-[10px] md:text-xs font-medium rounded-full uppercase tracking-wide">
                    Bine ai venit!
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 md:mb-3 tracking-tight">
                  Lucru si Afaceri - TOTUL intr-un singur loc!
                </h1>
                <p className="text-blue-100/90 text-sm md:text-base max-w-lg leading-relaxed">
                  Descoperă cele mai noi anunțuri, locuri de muncă și oportunități de afaceri din comunitatea ta.
                </p>
                
                {/* Stats or quick info - visible on larger screens */}
                <div className="hidden md:flex items-center gap-6 mt-5 pt-5 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-sm text-blue-100/80">Actualizat în timp real</span>
                  </div>
                  <div className="text-sm text-blue-100/80">
                    <span className="font-semibold text-white">100%</span> Gratuit
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Categories - Horizontal scroll */}
            <div className="lg:hidden overflow-x-auto scrollbar-hide mb-2">
              <div className="flex gap-3 px-3 py-2">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.key}
                    href={`/categorie/${cat.key}`}
                    className="flex flex-col items-center gap-2 min-w-[72px]"
                  >
                    <div className={`w-12 h-12 rounded-full ${categoryStyles[cat.key]?.gradient} flex items-center justify-center shadow-md active:scale-95 transition-transform`}>
                      {categoryStyles[cat.key]?.icon}
                    </div>
                    <span className="text-xs text-gray-700 font-medium whitespace-nowrap">{cat.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Posts Feed */}
            <PostFeed />

            {/* Mobile FAB - Add Post */}
            {!loading && user && (
              <Link
                href="/postare-noua"
                className="lg:hidden fixed bottom-6 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 active:scale-95 transition-all"
                aria-label="Adaugă anunț"
              >
                <PlusCircle className="w-7 h-7" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
