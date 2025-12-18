'use client';

/**
 * Lazy Video Component
 * - Shows first frame as thumbnail immediately
 * - Plays instantly when clicked
 * - Preloads video in background for instant playback
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
  const [isReady, setIsReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);

  // Preload the video and show first frame
  useEffect(() => {
    const video = previewRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setIsReady(true);
    };

    video.addEventListener('loadeddata', handleLoadedData);
    
    // Force load the first frame
    video.load();

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
    };
  }, [src]);

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(true);
    
    // Small delay to ensure video element is mounted, then play
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {
          // Autoplay might be blocked, that's ok
        });
      }
    }, 50);
    
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
  };

  if (!isPlaying) {
    // Show thumbnail with first frame and play button
    return (
      <div 
        className={`relative bg-black cursor-pointer ${containerClassName}`}
        onClick={handlePlay}
      >
        {/* Video element to capture first frame - always visible */}
        <video
          ref={previewRef}
          src={`${src}#t=0.5`}
          className={`w-full h-full object-cover ${className}`}
          muted
          playsInline
          preload="auto"
          poster={poster}
          onLoadedData={() => setIsReady(true)}
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/95 flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-gray-900 ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Video indicator */}
        <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md flex items-center gap-1">
          <Play className="w-3 h-3" fill="currentColor" />
          <span>Video</span>
        </div>
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
        poster={poster}
        onEnded={handleVideoEnd}
      />
      
      {/* Mute toggle button */}
      {!autoShowControls && (
        <button
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
});

export default LazyVideo;
