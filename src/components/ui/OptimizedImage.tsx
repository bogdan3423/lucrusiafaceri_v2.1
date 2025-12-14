'use client';

/**
 * Optimized Image Component
 * - Instant display with blur placeholder (LQIP effect)
 * - Background loading of full resolution
 * - Smooth transition when loaded
 * - Viewport-aware priority loading
 * - Cached to prevent re-fetching
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
  showPlaceholder?: boolean;
}

// Generate a dominant color placeholder based on URL hash
function generatePlaceholderColor(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  // Generate soft, pleasant colors
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 20%, 90%)`;
}

// Tiny SVG blur placeholder (inlined, no network request)
function getBlurPlaceholder(color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8">
    <rect width="8" height="8" fill="${color}"/>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
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
  showPlaceholder = true,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(() => imageCache.isLoaded(src));
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Generate placeholder color based on URL
  const placeholderColor = generatePlaceholderColor(src || '');
  const blurPlaceholder = getBlurPlaceholder(placeholderColor);

  // Register with cache and start loading
  useEffect(() => {
    if (!src) return;

    // Check if already cached
    if (imageCache.isLoaded(src)) {
      setIsLoaded(true);
      return;
    }

    // Observe for viewport visibility if not priority
    if (!priority && containerRef.current) {
      imageCache.observe(containerRef.current, src);
    }

    // Start preloading
    imageCache.preload(src, priority ? 'high' : 'low').then((loaded) => {
      if (loaded) {
        setIsLoaded(true);
        onLoad?.();
      }
    });

    return () => {
      if (containerRef.current) {
        imageCache.unobserve(containerRef.current, src);
      }
    };
  }, [src, priority, onLoad]);

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

  if (hasError) {
    return (
      <div 
        ref={containerRef}
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${aspectClasses[aspectRatio]} ${containerClassName}`}
        onClick={onClick}
      >
        <ImageOff className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${aspectClasses[aspectRatio]} ${containerClassName}`}
      onClick={onClick}
      style={{ backgroundColor: placeholderColor }}
    >
      {/* Blur placeholder - shows immediately */}
      {showPlaceholder && !isLoaded && (
        <img
          src={blurPlaceholder}
          alt=""
          className={`absolute inset-0 w-full h-full ${objectFitClass} blur-sm scale-110`}
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
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
    </div>
  );
});

export default OptimizedImage;

/**
 * Preload images helper - call before rendering feed
 */
export function preloadImages(urls: string[], priorityCount = 3) {
  const priorityIndices = Array.from({ length: Math.min(priorityCount, urls.length) }, (_, i) => i);
  imageCache.preloadBatch(urls, priorityIndices);
}

/**
 * Hook for preloading post images
 */
export function usePreloadPostImages(posts: { media?: { url: string }[]; images?: string[] }[]) {
  useEffect(() => {
    const allUrls: string[] = [];
    
    posts.forEach((post, postIndex) => {
      const urls: string[] = [];
      
      if (post.media?.length) {
        post.media.forEach(m => {
          if (m.url) urls.push(m.url);
        });
      } else if (post.images?.length) {
        urls.push(...post.images);
      }
      
      // First 3 posts get priority, first image of each
      urls.forEach((url, imgIndex) => {
        if (postIndex < 3 && imgIndex === 0) {
          imageCache.preload(url, 'high');
        } else {
          allUrls.push(url);
        }
      });
    });
    
    // Queue remaining images
    allUrls.forEach(url => imageCache.preload(url, 'low'));
  }, [posts]);
}
