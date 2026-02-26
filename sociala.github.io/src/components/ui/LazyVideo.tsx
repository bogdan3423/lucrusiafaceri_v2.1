'use client';

/**
 * LazyVideo — Efficient lazy-loaded video player
 * 
 * STRATEGY:
 * - Video element always in DOM but with preload="none" initially
 * - IntersectionObserver switches to preload="metadata" when near viewport (200px)
 * - Only starts playing when actually visible (threshold: 0.3)
 * - Pauses and stops buffering when scrolled away
 * - Starts muted (required for mobile autoplay), user can unmute via tap
 * - Tap to toggle play/pause, mute button in corner
 * - Loops automatically
 */

import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface LazyVideoProps {
  src: string;
  poster?: string;
  className?: string;
  containerClassName?: string;
}

const LazyVideo = memo(function LazyVideo({
  src,
  poster,
  className = '',
  containerClassName = '',
}: LazyVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isVisibleRef = useRef(false);
  const userPausedRef = useRef(false);

  useEffect(() => { userPausedRef.current = userPaused; }, [userPaused]);

  // Play video with sound — try unmuted first, fall back to muted if browser blocks
  const tryPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || userPausedRef.current) return;

    // First attempt: play with sound
    video.muted = false;
    const p = video.play();
    if (p) {
      p.then(() => {
        setIsMuted(false);
      }).catch(() => {
        // Browser blocked unmuted autoplay — fall back to muted
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    }
  }, []);

  // Unlock audio on first user interaction anywhere on page
  useEffect(() => {
    const unlock = () => {
      const video = videoRef.current;
      if (video && video.muted && isVisibleRef.current && !userPausedRef.current) {
        video.muted = false;
        setIsMuted(false);
      }
    };
    document.addEventListener('click', unlock, { once: true });
    document.addEventListener('touchstart', unlock, { once: true });
    return () => {
      document.removeEventListener('click', unlock);
      document.removeEventListener('touchstart', unlock);
    };
  }, []);

  // Single IntersectionObserver with two thresholds:
  // - rootMargin 200px: start loading metadata when approaching
  // - threshold 0.3: play when 30% visible, pause when less
  useEffect(() => {
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    // Preload observer — loads metadata when near viewport
    const preloadObserver = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.preload = 'metadata';
          preloadObserver.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    // Visibility observer — plays/pauses based on visibility
    const playObserver = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;

        if (entry.isIntersecting) {
          // Only start loading full video data when actually visible
          video.preload = 'auto';
          if (!userPausedRef.current) {
            tryPlay();
          }
        } else {
          // Pause and stop buffering when not visible
          if (!video.paused) {
            video.pause();
          }
          // Switch back to metadata-only to free memory/bandwidth
          video.preload = 'metadata';
        }
      },
      { threshold: 0.3 }
    );

    preloadObserver.observe(el);
    playObserver.observe(el);

    return () => {
      preloadObserver.disconnect();
      playObserver.disconnect();
    };
  }, [tryPlay]);

  // When enough data is buffered, try playing if visible
  const handleCanPlay = useCallback(() => {
    setIsLoaded(true);
    if (isVisibleRef.current && !userPausedRef.current) {
      tryPlay();
    }
  }, [tryPlay]);

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
      // User tap counts as interaction — play with sound
      video.muted = false;
      setIsMuted(false);
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
    }
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (!video) return;
    const newMuted = !isMuted;
    video.muted = newMuted;
    setIsMuted(newMuted);
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
        src={src}
        className={`w-full h-full object-cover ${className}`}
        playsInline
        preload="none"
        poster={poster}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Play indicator when paused by user */}
      {!isPlaying && isLoaded && userPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
            <Play className="w-8 h-8 text-white ml-1" />
          </div>
        </div>
      )}

      {/* Mute toggle */}
      {isLoaded && (
        <button
          data-mute-btn
          onClick={toggleMute}
          className="absolute bottom-3 right-3 p-2 bg-black/50 backdrop-blur-sm text-white rounded-full hover:bg-black/70 transition-colors z-10"
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
});

export default LazyVideo;
