'use client';

/**
 * Optimized Image Component - Instant Loading Experience
 * 
 * KEY PRINCIPLES:
 * - NO visible placeholders (no gray boxes, no skeletons)
 * - Images load instantly with eager loading
 * - Layout space is reserved (no layout shift)
 * - High priority fetch for all images
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { ImageOff } from 'lucide-react';

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
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Check if image is already cached
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

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
      className={`relative w-full h-full overflow-hidden ${containerClassName}`}
      onClick={onClick}
    >
      {/* 
        The image is always rendered in the DOM.
        We use opacity transition for smooth appearance.
        bg-gray-50 is a very light background that blends naturally.
      */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        className={`
          w-full h-full ${objectFitClass} ${className}
        `}
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
