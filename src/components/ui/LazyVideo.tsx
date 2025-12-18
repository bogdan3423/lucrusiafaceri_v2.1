'use client';

/**
 * Lazy Video Component - Instagram-style
 * - Shows first frame thumbnail immediately
 * - Instant playback when tapped
 * - Preloads video for smooth experience
 */

import React, { useState, useRef, useEffect, memo } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

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
  const [thumbnailReady, setThumbnailReady] = useState(false);
  const [canPlayThrough, setCanPlayThrough] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const thumbnailVideoRef = useRef<HTMLVideoElement>(null);

  // Preload video for instant playback
  useEffect(() => {
    const video = document.createElement('video');
    video.src = src;
    video.preload = 'auto';
    video.muted = true;
    
    video.oncanplaythrough = () => {
      setCanPlayThrough(true);
    };
    
    // Start loading
    video.load();
    
    return () => {
      video.src = '';
    };
  }, [src]);

  // Handle thumbnail video loaded
  const handleThumbnailLoaded = () => {
    const video = thumbnailVideoRef.current;
    if (video) {
      // Seek to 0.5 seconds to get a good frame (not black)
      video.currentTime = 0.5;
    }
  };

  const handleThumbnailSeeked = () => {
    setThumbnailReady(true);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsPlaying(true);
    onClick?.(e);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
    }
  };

  // Pause and reset when component goes out of view
  useEffect(() => {
    if (isPlaying && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [isPlaying]);

  if (!isPlaying) {
    // Show thumbnail with first frame and play button
    return (
      <div 
        className={`relative bg-gray-900 cursor-pointer overflow-hidden ${containerClassName}`}
        onClick={handlePlay}
      >
        {/* Hidden video to extract thumbnail frame */}
        <video
          ref={thumbnailVideoRef}
          src={src}
          className={`w-full h-full object-cover ${className} ${thumbnailReady ? 'opacity-100' : 'opacity-0'}`}
          muted
          playsInline
          preload="auto"
          onLoadedData={handleThumbnailLoaded}
          onSeeked={handleThumbnailSeeked}
        />
        
        {/* Loading placeholder */}
        {!thumbnailReady && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
        
        {/* Play button overlay - always visible */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-transform">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Video indicator badge */}
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/60 backdrop-blur-sm text-white text-xs font-medium rounded-md flex items-center gap-1">
          <Play className="w-3 h-3" fill="currentColor" />
          Video
        </div>
        
        {/* Preload indicator */}
        {canPlayThrough && (
          <div className="absolute bottom-2 right-2 w-2 h-2 bg-green-500 rounded-full" title="Ready to play" />
        )}
      </div>
    );
  }

  // Video is playing - show full video player
  return (
    <div className={`relative bg-black ${containerClassName}`} onClick={(e) => e.stopPropagation()}>
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover ${className}`}
        controls={autoShowControls}
        playsInline
        autoPlay
        muted={isMuted}
        preload="auto"
        onEnded={handleVideoEnd}
      />
      
      {/* Mute toggle for non-controls mode */}
      {!autoShowControls && (
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
