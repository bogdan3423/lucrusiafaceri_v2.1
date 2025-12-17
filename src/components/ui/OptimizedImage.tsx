'use client';

/**
 * Optimized Image Component
 * - Fast loading with smooth fade-in
 * - Shows placeholder background while loading
 * - Images visible immediately, fade in smoothly when loaded
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { ImageOff } from 'lucide-react';
import { imageCache } from '@/lib/cache';

interface OptimizedImageProps {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
  aspectRatio?: 'square' | 'video' | 'auto' | 'none';
  objectFit?: 'cover' | 'contain';
  onLoad?: () => void;
  onError?: () => void;
  onClick?: () => void;
  showPlaceholder?: boolean;
}

const OptimizedImage = memo(function OptimizedImage({
  src,
  alt = '',
  className = '',
  containerClassName = '',
  priority = false,
  aspectRatio = 'none',
  objectFit = 'cover',
  onLoad,
  onError,
  onClick,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(() => imageCache.isLoaded(src));
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Start preloading immediately
  useEffect(() => {
    if (!src || hasError) return;
    
    // If already cached, mark as loaded
    if (imageCache.isLoaded(src)) {
      setIsLoaded(true);
      return;
    }

    // Start background preload
    imageCache.preload(src, priority ? 'high' : 'low');
  }, [src, priority, hasError]);

  const handleImageLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setHasError(true);
    onError?.();
  };

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    auto: 'aspect-[4/3]',
    none: '',
  };

  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  // Error state
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-300 ${aspectClasses[aspectRatio]} ${containerClassName}`}
        onClick={onClick}
      >
        <ImageOff className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div 
      className={`relative overflow-hidden bg-gray-100 ${aspectClasses[aspectRatio]} ${containerClassName}`}
      onClick={onClick}
    >
      {/* Image - always rendered, fades in when loaded */}
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
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
      
      {/* Subtle loading shimmer - only shown while loading */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
      )}
    </div>
  );
});

export default OptimizedImage;
