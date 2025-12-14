'use client';

/**
 * Premium Image Component
 * - NO visible placeholders or loading states
 * - Images appear only when fully loaded
 * - Layout dimensions reserved to prevent shift
 * - Invisible loading - user never sees loading states
 */

import React, { useState, useEffect, useRef, memo } from 'react';
import { ImageOff } from 'lucide-react';
import { imageCache } from '@/lib/imageCache';

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
  showPlaceholder?: boolean; // Kept for API compatibility, but ignored
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
  // Check cache synchronously for instant display
  const [isReady, setIsReady] = useState(() => imageCache.isLoaded(src));
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Preload and track loading state
  useEffect(() => {
    if (!src) return;

    // Already cached - show immediately
    if (imageCache.isLoaded(src)) {
      setIsReady(true);
      return;
    }

    // Start preloading with appropriate priority
    imageCache.preload(src, priority ? 'high' : 'low').then((loaded) => {
      if (loaded) {
        setIsReady(true);
        onLoad?.();
      }
    });

    // Observe for viewport visibility if not priority
    if (!priority && containerRef.current) {
      imageCache.observe(containerRef.current, src);
    }

    return () => {
      if (containerRef.current) {
        imageCache.unobserve(containerRef.current, src);
      }
    };
  }, [src, priority, onLoad]);

  const handleImageLoad = () => {
    setIsReady(true);
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

  // Error state - show error icon
  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-50 text-gray-300 ${aspectClasses[aspectRatio]} ${containerClassName}`}
        onClick={onClick}
      >
        <ImageOff className="w-6 h-6" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-50 ${aspectClasses[aspectRatio]} ${containerClassName}`}
      onClick={onClick}
    >
      {/* Image - visible only when fully loaded, no transition */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`
          w-full h-full ${objectFitClass} ${className}
          ${isReady ? 'opacity-100' : 'opacity-0'}
        `}
        style={{ visibility: isReady ? 'visible' : 'hidden' }}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
});

export default OptimizedImage;
