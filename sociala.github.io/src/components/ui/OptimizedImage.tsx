'use client';

/**
 * OptimizedImage — Lightweight, fast image component
 * 
 * STRATEGY:
 * - Single IntersectionObserver triggers rendering when near viewport (400px margin)
 * - No JS-side image cache — browser HTTP cache handles this natively
 * - No bulk preloading — each image loads on its own when it enters the load zone
 * - Simple fade-in on load; instant if browser-cached
 * - Priority images skip observer and render immediately with fetchPriority="high"
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
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
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldRender, setShouldRender] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // IntersectionObserver for non-priority images
  useEffect(() => {
    if (priority) {
      setShouldRender(true);
      return;
    }

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [priority]);

  // Reset state when src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
  }, [src]);

  // Check if already loaded from browser cache on mount
  useEffect(() => {
    if (shouldRender && imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [shouldRender, onLoad]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

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

  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden bg-gray-100 ${containerClassName}`}
      onClick={onClick}
    >
      {shouldRender && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className={`w-full h-full ${objectFitClass} transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={handleLoad}
          onError={handleError}
        />
      )}
    </div>
  );
});

export default OptimizedImage;
