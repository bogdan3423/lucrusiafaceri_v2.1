'use client';

/**
 * Lazy Video Component - Optimized for performance
 * - Uses blob caching for instant playback on navigation
 * - Loads video only when near viewport or on interaction
 * - No visible loading states - clean premium UX
 * - Stable layout maintained at all times
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';
import { videoCache } from '@/lib/cache';

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  containerClassName?: string;
  autoShowControls?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

const LazyVideo = memo(function LazyVideo({
  src,
  poster,
  className = '',
  containerClassName = '',
  autoShowControls = true,
  onClick,
}: LazyVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [videoSrc, setVideoSrc] = useState<string>(() => {
    // Check if already cached
    const cached = videoCache.getCachedUrl(src);
    return cached || src;
  });
  const [isInView, setIsInView] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStartedLoadingRef = useRef(false);

  // Observe visibility to start preloading when near viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Start caching video when in view
  useEffect(() => {
    if (!isInView || hasStartedLoadingRef.current) return;
    hasStartedLoadingRef.current = true;

    // Check cache first
    const cached = videoCache.getCachedUrl(src);
    if (cached) {
      setVideoSrc(cached);
      return;
    }

    // Start background caching
    videoCache.preload(src, 'low').then((blobUrl) => {
      if (blobUrl) {
        setVideoSrc(blobUrl);
      }
    });
  }, [src, isInView]);

  // Seek to get first frame when metadata loads
  const handleMetadataLoaded = useCallback(() => {
    const video = videoRef.current;
    if (video && video.currentTime === 0) {
      video.currentTime = 0.1;
    }
  }, []);

  const handleCanPlay = useCallback(() => {
    setIsReady(true);
  }, []);

  const handleSeeked = useCallback(() => {
    setIsReady(true);
  }, []);

  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const video = videoRef.current;
    if (video) {
      // Prioritize video loading if not cached
      if (!videoCache.isCached(src)) {
        videoCache.prioritize(src);
      }
      
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
    onClick?.(e);
  }, [src, onClick]);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const handleVideoEnd = useCallback(() => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0.1;
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-black cursor-pointer overflow-hidden ${containerClassName}`}
      onClick={!isPlaying ? handlePlay : undefined}
    >
      {/* Video element - always rendered for stable layout */}
      <video
        ref={videoRef}
        src={videoSrc}
        className={`w-full h-full object-cover ${className}`}
        muted={isMuted}
        playsInline
        preload="metadata"
        controls={isPlaying && autoShowControls}
        poster={poster}
        onLoadedMetadata={handleMetadataLoaded}
        onCanPlay={handleCanPlay}
        onSeeked={handleSeeked}
        onEnded={handleVideoEnd}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      {/* Play button overlay - always show play icon when not playing (no spinner) */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
      )}

      {/* Video indicator badge */}
      {!isPlaying && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md flex items-center gap-1 pointer-events-none">
          <Play className="w-3 h-3" fill="currentColor" />
          Video
        </div>
      )}
      
      {/* Mute toggle for non-controls mode */}
      {isPlaying && !autoShowControls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
});

export default LazyVideo;
