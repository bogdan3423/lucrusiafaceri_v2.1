'use client';

/**
 * Post Card - Instagram-style grid layout with lightbox
 * Grid display in feed, swipeable fullscreen modal on click
 * Premium loading: images appear only when ready, no visible loading states
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Share2, MoreHorizontal, ImageOff, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Post, MediaItem } from '@/types';
import { formatDate, formatPrice } from '@/lib/utils';
import OptimizedImage from '@/components/ui/OptimizedImage';
import LazyVideo from '@/components/ui/LazyVideo';
import { imageCache } from '@/lib/imageCache';

interface PostCardProps {
  post: Post;
}

export default function PostCard({ post }: PostCardProps) {
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const videoCarouselRef = useRef<HTMLDivElement>(null);

  // Get media array
  const media: MediaItem[] = React.useMemo(() => {
    if (post.media && post.media.length > 0) return post.media;
    
    const items: MediaItem[] = [];
    if (post.images?.length) {
      post.images.forEach(url => items.push({ url, type: 'image' }));
    }
    if (post.videos?.length) {
      post.videos.forEach(url => items.push({ url, type: 'video' }));
    }
    return items;
  }, [post.media, post.images, post.videos]);

  const authorName = post.userName || 'Anonim';
  const authorImage = post.userImage;

  // Preload images with priority caching (first image high priority)
  useEffect(() => {
    const imageUrls = media.filter(m => m.type === 'image').map(m => m.url);
    if (imageUrls.length > 0) {
      imageCache.preloadBatch(imageUrls, [0]); // First image is priority
    }
  }, [media]);

  const handleImageError = useCallback((index: number) => {
    setImageErrors(prev => new Set(prev).add(index));
  }, []);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = '';
  };

  // Get only images for lightbox (exclude videos)
  const imageMedia = media.filter(item => item.type === 'image');

  // Handle image click - open lightbox (videos are handled natively)
  const handleImageClick = (item: MediaItem) => {
    if (item.type === 'image') {
      const imageIndex = imageMedia.findIndex(img => img.url === item.url);
      if (imageIndex !== -1) {
        openLightbox(imageIndex);
      }
    }
  };

  // Render media item (image or video) with optimized loading
  const renderMediaItem = (item: MediaItem, index: number, className: string = '') => {
    if (item.type === 'video') {
      return (
        <LazyVideo
          src={item.url}
          poster={item.thumbnailUrl}
          className={className}
          containerClassName="w-full h-full"
        />
      );
    }
    
    if (imageErrors.has(index)) {
      return (
        <div className={`w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}>
          <ImageOff className="w-8 h-8" />
        </div>
      );
    }
    
    return (
      <OptimizedImage
        src={item.url}
        alt=""
        className={className}
        containerClassName="w-full h-full"
        priority={index === 0}
        objectFit="cover"
        onError={() => handleImageError(index)}
      />
    );
  };

  // Instagram-style grid layout
  const renderMediaGrid = () => {
    if (media.length === 0) {
      return (
        <div className="aspect-square flex flex-col items-center justify-center bg-gray-100 text-gray-400">
          <ImageOff className="w-16 h-16 mb-3" />
          <span>Fără imagine</span>
        </div>
      );
    }

    // Helper to render a single grid item
    const renderGridItem = (item: MediaItem, index: number, extraClass: string = '') => {
      if (item.type === 'video') {
        return (
          <div key={index} className={`overflow-hidden bg-gray-100 ${extraClass}`}>
            <LazyVideo
              src={item.url}
              poster={item.thumbnailUrl}
              containerClassName="w-full h-full"
            />
          </div>
        );
      }
      return (
        <div 
          key={index}
          className={`overflow-hidden bg-gray-100 cursor-pointer ${extraClass}`}
          onClick={() => handleImageClick(item)}
        >
          {renderMediaItem(item, index)}
        </div>
      );
    };

    if (media.length === 1) {
      const item = media[0];
      if (item.type === 'video') {
        return (
          <div className="aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-100">
            <LazyVideo
              src={item.url}
              poster={item.thumbnailUrl}
              containerClassName="w-full h-full"
            />
          </div>
        );
      }
      return (
        <div 
          className="aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-100 cursor-pointer"
          onClick={() => handleImageClick(item)}
        >
          {renderMediaItem(item, 0)}
        </div>
      );
    }

    if (media.length === 2) {
      // Check if both items are videos - use swipeable carousel
      const allVideos = media.every(item => item.type === 'video');
      
      if (allVideos) {
        return (
          <div className="relative aspect-square sm:aspect-[4/3] overflow-hidden bg-gray-100">
            {/* Swipeable container */}
            <div
              ref={videoCarouselRef}
              className="flex h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentVideoIndex * 100}%)` }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                videoCarouselRef.current?.setAttribute('data-touch-start', touch.clientX.toString());
              }}
              onTouchEnd={(e) => {
                const startX = parseFloat(videoCarouselRef.current?.getAttribute('data-touch-start') || '0');
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                
                if (Math.abs(diff) > 50) {
                  if (diff > 0 && currentVideoIndex < media.length - 1) {
                    setCurrentVideoIndex(prev => prev + 1);
                  } else if (diff < 0 && currentVideoIndex > 0) {
                    setCurrentVideoIndex(prev => prev - 1);
                  }
                }
              }}
            >
              {media.map((item, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                  <LazyVideo
                    src={item.url}
                    poster={item.thumbnailUrl}
                    containerClassName="w-full h-full"
                  />
                </div>
              ))}
            </div>
            
            {/* Navigation arrows */}
            {currentVideoIndex > 0 && (
              <button
                onClick={() => setCurrentVideoIndex(prev => prev - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <ChevronLeft className="w-5 h-5 text-gray-800" />
              </button>
            )}
            {currentVideoIndex < media.length - 1 && (
              <button
                onClick={() => setCurrentVideoIndex(prev => prev + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-lg z-10"
              >
                <ChevronRight className="w-5 h-5 text-gray-800" />
              </button>
            )}
            
            {/* Dots indicator */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
              {media.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentVideoIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentVideoIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        );
      }
      
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-[2/1] sm:aspect-[2/1]">
          {media.map((item, index) => renderGridItem(item, index))}
        </div>
      );
    }

    if (media.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-square">
          {renderGridItem(media[0], 0, 'row-span-2')}
          {renderGridItem(media[1], 1)}
          {renderGridItem(media[2], 2)}
        </div>
      );
    }

    if (media.length === 4) {
      return (
        <div className="grid grid-cols-2 gap-0.5 aspect-square">
          {media.map((item, index) => renderGridItem(item, index))}
        </div>
      );
    }

    // 5+ media - 2x2 grid with +N overlay on last item
    const displayMedia = media.slice(0, 4);
    const remainingCount = media.length - 4;

    return (
      <div className="grid grid-cols-2 gap-0.5 aspect-square">
        {displayMedia.map((item, index) => {
          if (item.type === 'video') {
            return (
              <div key={index} className="relative overflow-hidden bg-gray-100">
                <LazyVideo
                  src={item.url}
                  poster={item.thumbnailUrl}
                  containerClassName="w-full h-full"
                />
                {index === 3 && remainingCount > 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl sm:text-3xl font-bold">+{remainingCount}</span>
                  </div>
                )}
              </div>
            );
          }
          return (
            <div 
              key={index}
              className="relative overflow-hidden bg-gray-100 cursor-pointer"
              onClick={() => handleImageClick(item)}
            >
              {renderMediaItem(item, index)}
              {index === 3 && remainingCount > 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-none">
                  <span className="text-white text-2xl sm:text-3xl font-bold">+{remainingCount}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <article className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 overflow-hidden md:hover:shadow-lg transition-shadow border-b-8 border-gray-100 md:border-b-0 md:mb-6">
        {/* Header */}
        <div className="px-3 py-3 md:p-4 flex items-center justify-between">
          <Link href={`/utilizator/${post.userId || post.sellerId || ''}`} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5 overflow-hidden">
                {authorImage ? (
                  <img
                    src={authorImage}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=3b82f6&color=fff&size=44`;
                    }}
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{authorName.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{authorName}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatDate(post.createdAt)}</span>
                {post.location && (
                  <>
                    <span>•</span>
                    <MapPin className="w-3 h-3" />
                    <span>{post.location}</span>
                  </>
                )}
              </div>
            </div>
          </Link>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Media Grid */}
        <div className="relative">
          {renderMediaGrid()}
          
          {/* Price Badge */}
          {post.price !== undefined && post.price > 0 && (
            <div className="absolute bottom-3 left-3 bg-white/95 px-3 py-1.5 rounded-full shadow-lg z-10">
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(post.price, post.currency)}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-3 py-3 md:px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-green-500">
              <Share2 className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 pb-3 md:px-4">
          <Link href={`/postare/${post.id}`}>
            <h3 className="font-bold text-base md:text-lg text-gray-900 hover:text-blue-600 line-clamp-2 mb-1">
              {post.title || 'Fără titlu'}
            </h3>
          </Link>
          {post.description && (
            <p className="text-gray-600 text-sm line-clamp-3 md:line-clamp-2">{post.description}</p>
          )}
        </div>

        {/* CTA */}
        <div className="px-3 pb-4 md:px-4">
          <Link
            href={`/postare/${post.id}`}
            className="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors"
          >
            Vezi detalii
          </Link>
        </div>
      </article>

      {/* Lightbox Modal - Only for images */}
      {lightboxOpen && imageMedia.length > 0 && (
        <MediaLightbox
          media={imageMedia}
          initialIndex={lightboxIndex}
          onClose={closeLightbox}
          imageErrors={imageErrors}
          onImageError={handleImageError}
        />
      )}
    </>
  );
}

// Lightbox Component
interface MediaLightboxProps {
  media: MediaItem[];
  initialIndex: number;
  onClose: () => void;
  imageErrors: Set<number>;
  onImageError: (index: number) => void;
}

function MediaLightbox({ media, initialIndex, onClose, imageErrors, onImageError }: MediaLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([initialIndex]));
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchCurrentX = useRef(0);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const hasMultiple = media.length > 1;

  // Preload all images immediately when lightbox opens using cache
  useEffect(() => {
    const imageUrls = media
      .filter(item => item.type === 'image' && item.url)
      .map(item => item.url);
    
    // All images high priority in lightbox
    imageUrls.forEach((url, index) => {
      imageCache.preload(url, 'high').then((loaded) => {
        if (loaded) {
          setLoadedImages(prev => new Set(prev).add(index));
        }
      });
    });
  }, [media]);

  // Preload adjacent images with priority
  useEffect(() => {
    const preloadIndices = [
      currentIndex,
      (currentIndex + 1) % media.length,
      (currentIndex - 1 + media.length) % media.length,
    ];
    
    preloadIndices.forEach(idx => {
      const item = media[idx];
      if (item?.type === 'image' && item.url && !loadedImages.has(idx)) {
        imageCache.preload(item.url, 'high').then((loaded) => {
          if (loaded) {
            setLoadedImages(prev => new Set(prev).add(idx));
          }
        });
      }
    });
  }, [currentIndex, media, loadedImages]);

  const goToNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % media.length);
    setDragOffset(0);
  }, [media.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + media.length) % media.length);
    setDragOffset(0);
  }, [media.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && hasMultiple) goToPrev();
      if (e.key === 'ArrowRight' && hasMultiple) goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasMultiple, onClose, goToPrev, goToNext]);

  // Touch handlers for smooth swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchCurrentX.current = e.touches[0].clientX;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !hasMultiple) return;
    
    touchCurrentX.current = e.touches[0].clientX;
    const deltaX = touchCurrentX.current - touchStartX.current;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    
    // Only allow horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      setDragOffset(deltaX);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    
    const threshold = window.innerWidth * 0.2; // 20% of screen width
    
    if (dragOffset > threshold) {
      goToPrev();
    } else if (dragOffset < -threshold) {
      goToNext();
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent">
        <div className="text-white text-sm font-medium">
          {hasMultiple && `${currentIndex + 1} / ${media.length}`}
        </div>
        <button
          onClick={onClose}
          className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Carousel Track - All images rendered, uses transform for smooth sliding */}
      <div 
        ref={trackRef}
        className="absolute inset-0 flex items-center"
        style={{
          transform: `translateX(calc(-${currentIndex * 100}% + ${dragOffset}px))`,
          transition: isDragging.current ? 'none' : 'transform 0.3s ease-out',
          willChange: 'transform',
        }}
      >
        {media.map((item, index) => (
          <div 
            key={index}
            className="w-full h-full flex-shrink-0 flex items-center justify-center"
            style={{ minWidth: '100%' }}
          >
            {imageErrors.has(index) ? (
              <div className="flex items-center justify-center text-gray-400">
                <ImageOff className="w-16 h-16" />
              </div>
            ) : (
              <OptimizedImage
                src={item.url}
                alt=""
                containerClassName="w-full h-full flex items-center justify-center"
                className="max-w-full max-h-full"
                priority={true}
                objectFit="contain"
                showPlaceholder={true}
                onLoad={() => setLoadedImages(prev => new Set(prev).add(index))}
                onError={() => onImageError(index)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation Arrows - Desktop */}
      {hasMultiple && (
        <>
          <button
            onClick={goToPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:flex z-20"
          >
            <ChevronLeft className="w-8 h-8 text-white" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors hidden sm:flex z-20"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        </>
      )}

      {/* Dots indicator */}
      {hasMultiple && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {media.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setCurrentIndex(idx); setDragOffset(0); }}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === currentIndex 
                  ? 'bg-white w-6' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
