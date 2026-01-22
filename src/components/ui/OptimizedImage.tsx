'use client';

/**
 * Optimized Image Component - Instant Loading Experience
 * 
 * KEY PRINCIPLES:
 * - All images load EAGERLY (no lazy loading)
 * - Images are always in the DOM and loading
 * - No visible placeholders or loading states
 * - Smooth background color that matches design
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { ImageOff } from 'lucide-react';

// Global image cache to track loaded images
const imageCache = new Map<string, boolean>();

// Preload an image and cache it
export function preloadImage(src: string): Promise<void> {
  if (imageCache.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      imageCache.set(src, true);
      resolve();
    };
    
    img.onerror = () => resolve();
    img.src = src;
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
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached in browser on mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      imageCache.set(src, true);
      onLoad?.();
    }
  }, [src, onLoad]);

  // Preload nearby images
  useEffect(() => {
    if (preloadNearby.length > 0) {
      preloadImages(preloadNearby);
    }
  }, [preloadNearby]);

  const handleLoad = useCallback(() => {
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
      className={`relative w-full h-full overflow-hidden bg-gray-50 ${containerClassName}`}
      onClick={onClick}
    >
      {/* Image always rendered - loads eagerly with high priority */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full ${objectFitClass} ${className}`}
        loading="eager"
        decoding="sync"
        fetchPriority="high"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
});

export default OptimizedImage;
