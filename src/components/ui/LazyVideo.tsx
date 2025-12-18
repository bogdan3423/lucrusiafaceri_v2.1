'use client';

/**
 * Lazy Video Component - Instant Loading Experience
 * 
 * KEY PRINCIPLES:
 * - NO placeholders of any kind
 * - Shows FIRST FRAME immediately using #t=0.001
 * - Video preload="auto" for instant full video loading
 * - Cached videos don't reload on navigation
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build video source URL with time fragment for first frame
  // Using #t=0.001 forces the browser to load and display the first frame
  const videoSrcWithTime = `${src}#t=0.001`;

  // Handle metadata loaded - seek to get first frame
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      // Seek to 0.001 to ensure first frame is rendered
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
    // Only handle clicks on video element or play overlay
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
      className={`relative w-full h-full overflow-hidden cursor-pointer ${containerClassName}`}
      onClick={handleContainerClick}
    >
      {/* 
        Video element - always rendered for stable layout
        Using preload="metadata" and #t=0.001 for instant first frame
        No poster prop when we want the actual first frame to show
      */}
      <video
        ref={videoRef}
        src={videoSrcWithTime}
        className={`w-full h-full object-cover ${className}`}
        muted={isMuted}
        playsInline
        preload="auto"
        controls={isPlaying && autoShowControls}
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onSeeked={handleSeeked}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      {/* Play button overlay - shows when not playing */}
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
      
      {/* Mute toggle button - visible during playback without native controls */}
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
