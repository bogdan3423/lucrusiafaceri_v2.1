'use client';

/**
 * Lazy Video Component
 * - Shows placeholder/thumbnail instantly
 * - Only loads video when user clicks play
 * - Minimal network usage until interaction
 */

import React, { useState, useRef, memo } from 'react';
import { Play } from 'lucide-react';

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
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isActivated) {
      setIsActivated(true);
      setIsLoading(true);
    }
    onClick?.(e);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    // Auto-play when ready
    videoRef.current?.play();
  };

  // Generate a simple poster from video URL if none provided
  const videoPoster = poster || undefined;

  if (!isActivated) {
    // Show thumbnail with play button overlay
    return (
      <div 
        className={`relative bg-gray-900 cursor-pointer ${containerClassName}`}
        onClick={handleActivate}
      >
        {/* Video thumbnail - use first frame */}
        <video
          src={`${src}#t=0.1`}
          className={`w-full h-full object-cover ${className}`}
          muted
          playsInline
          preload="metadata"
          poster={videoPoster}
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors">
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
            <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>
      </div>
    );
  }

  // Video is activated - show full video player
  return (
    <div className={`relative bg-gray-900 ${containerClassName}`}>
      <video
        ref={videoRef}
        src={src}
        className={`w-full h-full object-cover ${className}`}
        controls={autoShowControls}
        playsInline
        preload="auto"
        poster={videoPoster}
        onCanPlay={handleCanPlay}
        onClick={(e) => e.stopPropagation()}
      />
      
      {/* Loading spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="w-10 h-10 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

export default LazyVideo;
