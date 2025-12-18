'use client';

/**
 * Lazy Video Component - Fast loading
 * - Uses preload="metadata" for instant thumbnail (only loads first few KB)
 * - Full video loads only when play is clicked
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
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Seek to 0.5s for thumbnail when metadata loads
  const handleMetadataLoaded = () => {
    const video = videoRef.current;
    if (video && video.currentTime === 0) {
      video.currentTime = 0.1; // Small seek to get first frame
    }
  };

  const handleSeeked = () => {
    setMetadataLoaded(true);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
      setIsPlaying(true);
    }
    onClick?.(e);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (video) {
      video.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.currentTime = 0.1;
    }
  };

  return (
    <div 
      className={`relative bg-black cursor-pointer overflow-hidden ${containerClassName}`}
      onClick={!isPlaying ? handlePlay : undefined}
    >
      {/* Single video element - preload only metadata for fast thumbnail */}
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover ${className}`}
        muted={isMuted}
        playsInline
        preload="metadata"
        controls={isPlaying && autoShowControls}
        onLoadedMetadata={handleMetadataLoaded}
        onSeeked={handleSeeked}
        onEnded={handleVideoEnd}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />
      
      {/* Play button overlay - shown when not playing */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-2xl">
            {!metadataLoaded ? (
              <div className="w-6 h-6 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 ml-1" fill="currentColor" />
            )}
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
