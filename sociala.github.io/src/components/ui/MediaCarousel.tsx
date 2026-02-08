'use client';

/**
 * Media Carousel Component - Premium Swipeable Gallery
 * 
 * KEY PRINCIPLES:
 * - All media rendered at once (no lazy rendering per slide)
 * - Smooth CSS transform-based sliding
 * - Videos show first frame immediately
 * - Preload all images for instant switching
 * - No visible loading states
 */

import React, { useState, useRef, useCallback, memo, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';
import { MediaItem } from '@/types';
import OptimizedImage, { preloadImages } from '@/components/ui/OptimizedImage';
import LazyVideo from '@/components/ui/LazyVideo';

interface MediaCarouselProps {
  media: MediaItem[];
  aspectRatio?: 'square' | 'video' | 'auto';
}

const MediaCarousel = memo(function MediaCarousel({ 
  media, 
  aspectRatio = 'auto' 
}: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const touchStartX = useRef<number>(0);
  const touchDeltaX = useRef<number>(0);
  const isDragging = useRef(false);
  const [dragOffset, setDragOffset] = useState(0);

  // Extract all image URLs for preloading
  const imageUrls = useMemo(() => 
    media.filter(m => m.type === 'image').map(m => m.url), 
    [media]
  );

  // Preload all images in the carousel for instant switching
  useEffect(() => {
    if (imageUrls.length > 0) {
      preloadImages(imageUrls);
    }
  }, [imageUrls]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % media.length);
    setDragOffset(0);
  }, [media.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    setDragOffset(0);
  }, [media.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || media.length <= 1) return;
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
    setDragOffset(touchDeltaX.current);
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const threshold = 50;
    if (touchDeltaX.current > threshold && currentIndex > 0) {
      goToPrevious();
    } else if (touchDeltaX.current < -threshold && currentIndex < media.length - 1) {
      goToNext();
    } else {
      setDragOffset(0);
    }
  };

  // Empty state
  if (!media || media.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-gray-50 flex items-center justify-center rounded-lg">
        <div className="text-center text-gray-300">
          <ImageOff className="w-12 h-12 mx-auto mb-2" />
          <span className="text-sm">Fără imagine</span>
        </div>
      </div>
    );
  }

  const hasMultiple = media.length > 1;
  const aspectClass = 
    aspectRatio === 'square' ? 'aspect-square' : 
    aspectRatio === 'video' ? 'aspect-video' : 
    'aspect-[4/3]';

  return (
    <div 
      className={`relative w-full ${aspectClass} overflow-hidden rounded-lg group`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Track - All media rendered, CSS transform for smooth sliding */}
      <div
        className="flex h-full will-change-transform"
        style={{ 
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {media.map((item, index) => (
          <div key={index} className="w-full h-full flex-shrink-0">
            {item.type === 'video' ? (
              <LazyVideo
                src={item.url}
                poster={item.thumbnailUrl}
              />
            ) : imageErrors.has(index) ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                <ImageOff className="w-8 h-8" />
              </div>
            ) : (
              <OptimizedImage
                src={item.url}
                alt=""
                priority={index === 0 || index === currentIndex}
                onError={() => handleImageError(index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Desktop only */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex z-10"
          >
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex z-10"
          >
            <ChevronRight className="w-5 h-5 text-gray-800" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {hasMultiple && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {media.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { 
                e.stopPropagation(); 
                setCurrentIndex(index); 
                setDragOffset(0); 
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex 
                  ? 'bg-white w-4' 
                  : 'bg-white/60 hover:bg-white/80'
              }`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {hasMultiple && (
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-md z-10">
          {currentIndex + 1}/{media.length}
        </div>
      )}
    </div>
  );
});

export default MediaCarousel;
