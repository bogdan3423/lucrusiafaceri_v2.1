'use client';

/**
 * Media Carousel - Optimized with CSS-based sliding and instant image loading
 * - All media rendered at once, no re-renders on navigation
 * - CSS transform for smooth, instant sliding
 * - LQIP placeholders for instant visual feedback
 * - Intelligent preloading with caching
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX, ImageOff } from 'lucide-react';
import { MediaItem } from '@/types';
import OptimizedImage from '@/components/ui/OptimizedImage';
import { imageCache } from '@/lib/imageCache';

interface MediaCarouselProps {
  media: MediaItem[];
  aspectRatio?: 'square' | 'video' | 'auto';
}

export default function MediaCarousel({ media, aspectRatio = 'auto' }: MediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [mutedVideos, setMutedVideos] = useState<Set<number>>(new Set(media.map((_, i) => i)));
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const videoRefs = useRef<Map<number, HTMLVideoElement>>(new Map());
  const touchStartX = useRef<number>(0);

  // Preload ALL images immediately with caching
  useEffect(() => {
    const imageUrls = media
      .filter(item => item.type === 'image' && item.url)
      .map(item => item.url);
    
    if (imageUrls.length > 0) {
      // First image is high priority, rest are queued
      imageCache.preloadBatch(imageUrls, [0]);
    }
  }, [media]);

  // Navigation with useCallback to prevent re-renders
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % media.length);
  }, [media.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + media.length) % media.length);
  }, [media.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goToNext() : goToPrevious();
    }
  };

  const togglePlayPause = useCallback((index: number) => {
    const video = videoRefs.current.get(index);
    if (video) {
      if (playingIndex === index) {
        video.pause();
        setPlayingIndex(null);
      } else {
        // Pause any currently playing video
        if (playingIndex !== null) {
          videoRefs.current.get(playingIndex)?.pause();
        }
        video.play();
        setPlayingIndex(index);
      }
    }
  }, [playingIndex]);

  const toggleMute = useCallback((index: number) => {
    const video = videoRefs.current.get(index);
    if (video) {
      const newMuted = !mutedVideos.has(index);
      video.muted = newMuted;
      setMutedVideos(prev => {
        const next = new Set(prev);
        if (newMuted) {
          next.add(index);
        } else {
          next.delete(index);
        }
        return next;
      });
    }
  }, [mutedVideos]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  }, []);

  if (!media || media.length === 0) {
    return (
      <div className="w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
        <div className="text-center text-gray-400">
          <ImageOff className="w-12 h-12 mx-auto mb-2" />
          <span className="text-sm">Fără imagine</span>
        </div>
      </div>
    );
  }

  const hasMultiple = media.length > 1;
  const aspectClass = aspectRatio === 'square' ? 'aspect-square' : aspectRatio === 'video' ? 'aspect-video' : 'aspect-[4/3]';

  return (
    <div 
      className={`relative w-full ${aspectClass} bg-black rounded-lg overflow-hidden group`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Carousel Track - All media rendered, CSS transform for smooth sliding */}
      <div
        className="flex h-full transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {media.map((item, index) => (
          <div key={index} className="w-full h-full flex-shrink-0 relative">
            {item.type === 'video' ? (
              <>
                <video
                  ref={(el) => {
                    if (el) videoRefs.current.set(index, el);
                  }}
                  src={`${item.url}#t=0.1`}
                  className="w-full h-full object-cover"
                  muted={mutedVideos.has(index)}
                  loop
                  playsInline
                  preload="auto"
                  poster={item.thumbnailUrl}
                  onPlay={() => setPlayingIndex(index)}
                  onPause={() => { if (playingIndex === index) setPlayingIndex(null); }}
                />
                {/* Video controls overlay - only show for current slide */}
                {index === currentIndex && (
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-10">
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlayPause(index); }} 
                      className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      {playingIndex === index ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleMute(index); }} 
                      className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      {mutedVideos.has(index) ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                  </div>
                )}
              </>
            ) : imageErrors.has(index) ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-400">
                <ImageOff className="w-8 h-8 mb-2" />
                <span className="text-sm">Imagine indisponibilă</span>
              </div>
            ) : (
              <OptimizedImage
                src={item.url}
                alt=""
                containerClassName="w-full h-full"
                priority={index === 0 || index === currentIndex}
                objectFit="cover"
                onError={() => handleImageError(index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      {hasMultiple && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToPrevious(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); goToNext(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white text-gray-800 rounded-full flex items-center justify-center shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentIndex(index); }}
                className={`h-2 rounded-full transition-all duration-200 ${
                  index === currentIndex ? 'bg-white w-5' : 'bg-white/50 w-2 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 text-white text-xs rounded-full font-medium z-10">
            {currentIndex + 1}/{media.length}
          </div>
        </>
      )}
    </div>
  );
}
