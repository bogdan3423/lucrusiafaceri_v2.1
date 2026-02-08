'use client';

/**
 * Optimized Image Component - Smart Loading Experience
 * 
 * KEY PRINCIPLES:
 * - Priority images (above the fold) load eagerly with high fetchPriority
 * - Non-priority images use lazy loading + IntersectionObserver
 * - Smooth fade-in transition when image loads
 * - Efficient caching to avoid reloads on navigation
 * - Batched preloading to avoid bandwidth contention
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { ImageOff } from 'lucide-react';

// Global image cache to track loaded images
const imageCache = new Set<string>();

// Preload an image and cache it
export function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.add(src);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

// Batch preload images - max 3 concurrent to avoid bandwidth contention
export function preloadImages(urls: string[]): void {
  const uncached = urls.filter(url => !imageCache.has(url));
  const batch = uncached.slice(0, 3);
  batch.forEach(url => preloadImage(url));
  
  if (uncached.length > 3) {
    setTimeout(() => {
      preloadImages(uncached.slice(3));
    }, 200);
  }
}

// Check if image is cached
export function isImageCached(src: string): boolean {
  return imageCache.has(src);
}

interface OptimizedImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  objectFit?: 'cover' | 'contain';
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  preloadNearby?: string[];
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  priority = false,
  objectFit = 'cover',
  onLoad,
  onError,
  onClick,
  preloadNearby = [],
}: OptimizedImageProps) {
  const isCached = imageCache.has(src);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(isCached);
  const [isInView, setIsInView] = useState(priority || isCached);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for non-priority images - start loading 300px before viewport
  useEffect(() => {
    if (priority || isCached) return;

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority, isCached]);

  // Check if image is already complete on mount (browser cache)
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      imageCache.add(src);
      setIsLoaded(true);
      onLoad?.();
    }
  }, [src, onLoad]);

  // Preload nearby images after this one loads
  useEffect(() => {
    if (isLoaded && preloadNearby.length > 0) {
      preloadImages(preloadNearby);
    }
  }, [isLoaded, preloadNearby]);

  const handleLoad = useCallback(() => {
    imageCache.add(src);
    setIsLoaded(true);
    onLoad?.();
  }, [src, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  if (hasError) {
    return (
      <div 
        className={`w-full h-full flex items-center justify-center bg-gray-50 text-gray-300 ${containerClassName}`}
        onClick={onClick}
      >
        <ImageOff className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gray-100 ${containerClassName}`}
      onClick={onClick}
    >
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full ${objectFitClass} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
});

export default OptimizedImage;
