'use client';

/**
 * Lazy Video Component - Bulletproof Mobile Auto-Play
 * 
 * KEY PRINCIPLES:
 * - <video> always in DOM with muted + autoPlay + playsInline (mobile requirement)
 * - preload="none" by default, switched to "auto" only when near viewport
 * - Single IntersectionObserver handles both loading and play/pause
 * - onLoadedData fires play if in view (handles race condition)
 * - Starts muted (guaranteed on all browsers), unmutes on first user tap
 * - No conditional rendering of <video> — eliminates ref timing bugs
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

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
}: LazyVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [userPaused, setUserPaused] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const userPausedRef = useRef(false);
  const userMutedRef = useRef(false);
  const hasTriedPlayRef = useRef(false);

  // Keep refs in sync
  useEffect(() => { userPausedRef.current = userPaused; }, [userPaused]);
  useEffect(() => { userMutedRef.current = userMuted; }, [userMuted]);

  // Core play function
  const triggerPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || userPausedRef.current) return;
    
    // Ensure muted for autoplay (required on mobile)
    video.muted = true;
    
    const p = video.play();
    if (p) {
      p.then(() => {
        // Successfully playing. Try to unmute if user hasn't muted
        if (!userMutedRef.current) {
          try {
            video.muted = false;
            setIsMuted(false);
          } catch {
            video.muted = true;
            setIsMuted(true);
          }
        }
      }).catch(() => {
        // Play failed — very rare for muted. Do nothing.
      });
    }
  }, []);

  // Single IntersectionObserver — handles preload + play/pause
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        isVisibleRef.current = visible;

        if (visible) {
          // Start loading full video
          video.preload = 'auto';
          
          if (!userPausedRef.current) {
            hasTriedPlayRef.current = true;
            triggerPlay();
          }
        } else {
          // Pause and reduce bandwidth
          video.pause();
          video.preload = 'none';
          hasTriedPlayRef.current = false;
        }
      },
      { threshold: 0.3, rootMargin: '50px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [triggerPlay]);

  // When video has enough data to play — handle race condition
  // This fires AFTER the video element has buffered enough frames
  const handleLoadedData = useCallback(() => {
    if (isVisibleRef.current && !userPausedRef.current && !hasTriedPlayRef.current) {
      hasTriedPlayRef.current = true;
      triggerPlay();
    }
  }, [triggerPlay]);

  // Also try on canplay for slower connections
  const handleCanPlay = useCallback(() => {
    if (isVisibleRef.current && !userPausedRef.current) {
      triggerPlay();
    }
  }, [triggerPlay]);

  // Unlock audio on first user interaction anywhere on page
  useEffect(() => {
    const unlock = () => {
      const video = videoRef.current;
      if (video && !userMutedRef.current && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    };
    document.addEventListener('touchstart', unlock, { once: true });
    document.addEventListener('click', unlock, { once: true });
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  // Tap on video = toggle play/pause
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if ((e.target as HTMLElement).closest('[data-mute-btn]')) return;

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setUserPaused(true);
    } else {
      setUserPaused(false);
      triggerPlay();
    }
  }, [isPlaying, triggerPlay]);

  // Toggle mute
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
    setUserMuted(newMuted);
  }, [isMuted]);

  // Loop video
  const handleEnded = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden cursor-pointer bg-gray-900 ${containerClassName}`}
      onClick={handleContainerClick}
    >
      <video
        ref={videoRef}
        src={`${src}#t=0.001`}
        className={`w-full h-full object-cover ${className}`}
        muted
        autoPlay
        playsInline
        preload="none"
        poster={poster}
        onLoadedData={handleLoadedData}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Mute toggle */}
      <button
        data-mute-btn
        onClick={toggleMute}
        className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors z-10"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
    </div>
  );
});

export default LazyVideo;
