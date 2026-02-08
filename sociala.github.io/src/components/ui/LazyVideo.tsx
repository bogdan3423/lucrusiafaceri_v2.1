'use client';

/**
 * Lazy Video Component - Smart Loading Experience
 * 
 * KEY PRINCIPLES:
 * - Uses IntersectionObserver to only load when near viewport
 * - preload="metadata" to load first frame without downloading entire video
 * - Shows first frame via #t=0.001 trick
 * - Full video downloads only when user interacts (plays)
 * - Clean play button overlay
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  containerClassName?: string;
  autoShowControls?: boolean;
}

const LazyVideo = memo(function LazyVideo({
  src,
  poster,
  className = '',
  containerClassName = '',
  autoShowControls = true,
}: LazyVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isInView, setIsInView] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build video source URL with time fragment for first frame
  const videoSrcWithTime = `${src}#t=0.001`;

  // IntersectionObserver - only load video when near viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Handle metadata loaded - seek to get first frame
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      if (video.currentTime === 0) {
        video.currentTime = 0.001;
      }
    }
  }, []);

  // Handle seeked - first frame is now visible
  const handleSeeked = useCallback(() => {
    setIsReady(true);
  }, []);

  // Handle can play
  const handleCanPlay = useCallback(() => {
    setIsReady(true);
  }, []);

  // Play video
  const handlePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const video = videoRef.current;
    if (video) {
      setHasInteracted(true);
      // Switch to full preload when user wants to play
      video.preload = 'auto';
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  }, []);

  // Pause video
  const handlePause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const video = videoRef.current;
    if (video) {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // Container click handler
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'VIDEO' || target.closest('[data-play-overlay]')) {
      if (isPlaying) {
        handlePause(e);
      } else {
        handlePlay(e);
      }
    }
  }, [isPlaying, handlePlay, handlePause]);

  // Toggle mute
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  // Video ended handler
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0.001;
    }
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden cursor-pointer bg-gray-900 ${containerClassName}`}
      onClick={handleContainerClick}
    >
      {isInView ? (
        <>
          <video
            ref={videoRef}
            src={videoSrcWithTime}
            className={`w-full h-full object-cover ${className}`}
            muted={isMuted}
            playsInline
            preload={hasInteracted ? 'auto' : 'metadata'}
            controls={isPlaying && autoShowControls}
            poster={poster}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onSeeked={handleSeeked}
            onEnded={handleEnded}
            onPause={() => setIsPlaying(false)}
            onPlay={() => setIsPlaying(true)}
          />
          
          {/* Play button overlay */}
          {!isPlaying && (
            <div 
              data-play-overlay
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl pointer-events-auto">
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
          
          {/* Mute toggle button */}
          {isPlaying && !autoShowControls && (
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
        </>
      ) : (
        /* Placeholder while not in view */
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <Play className="w-10 h-10 text-white/30" />
        </div>
      )}
    </div>
  );
});

export default LazyVideo;
