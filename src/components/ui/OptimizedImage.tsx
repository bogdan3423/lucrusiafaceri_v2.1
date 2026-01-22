'use client';

/**
 * Optimized Image Component - Ultra-Fast Loading Experience
 * 
 * KEY PRINCIPLES:
 * - Intersection Observer for smart lazy loading
 * - Image preloading for instant display
 * - Progressive loading with smooth fade-in
 * - Memory-efficient with proper cleanup
 * - No layout shift (space reserved)
 * - Browser cache optimization
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { ImageOff } from 'lucide-react';

// Global image cache to track loaded images
const imageCache = new Map<string, boolean>();
const preloadQueue = new Set<string>();
const MAX_CONCURRENT_PRELOADS = 6;
let activePreloads = 0;

// Preload an image and cache it
export function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src) || preloadQueue.has(src)) {
    return Promise.resolve();
  }
  
  preloadQueue.add(src);
  
  return new Promise((resolve) => {
    const processPreload = () => {
      if (activePreloads >= MAX_CONCURRENT_PRELOADS) {
        setTimeout(processPreload, 50);
        return;
      }
      
      activePreloads++;
      const img = new Image();
      img.decoding = 'async';
      
      const cleanup = () => {
        activePreloads--;
        preloadQueue.delete(src);
        resolve();
      };
      
      img.onload = () => {
        imageCache.set(src, true);
        cleanup();
      };
      
      img.onerror = cleanup;
      img.src = src;
    };
    
    processPreload();
  });
}

// Batch preload multiple images
export function preloadImages(urls: string[]): void {
  urls.forEach(url => preloadImage(url));
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
  preloadNearby?: string[]; // URLs of nearby images to preload
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
  const [isLoaded, setIsLoaded] = useState(() => imageCache.has(src));
  const [isVisible, setIsVisible] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isVisible) return;
    
    const container = containerRef.current;
    if (!container) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before entering viewport
        threshold: 0,
      }
    );
    
    observerRef.current.observe(container);
    
    return () => observerRef.current?.disconnect();
  }, [priority, isVisible]);

  // Check if image is already cached in browser
  useEffect(() => {
    if (isVisible && imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoaded(true);
      imageCache.set(src, true);
    }
  }, [src, isVisible]);

  // Preload nearby images when this image becomes visible
  useEffect(() => {
    if (isVisible && preloadNearby.length > 0) {
      preloadImages(preloadNearby);
    }
  }, [isVisible, preloadNearby]);

  // Priority images: preload immediately
  useEffect(() => {
    if (priority && src) {
      preloadImage(src);
    }
  }, [priority, src]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    imageCache.set(src, true);
    onLoad?.();
  }, [src, onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Error state
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
      {/* Only render image when visible or priority */}
      {isVisible && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`
            w-full h-full ${objectFitClass} ${className}
            transition-opacity duration-200 ease-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
      
      {/* Ultra-light placeholder while loading */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"
          style={{ animationDuration: '1.5s' }}
        />
      )}
    </div>
  );
});

export default OptimizedImage;
