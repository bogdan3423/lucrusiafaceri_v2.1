'use client';

/**
 * Lazy Video Component - Auto-Play with Sound
 * 
 * KEY PRINCIPLES:
 * - Uses IntersectionObserver to auto-play when scrolled into view
 * - Plays with sound by default (falls back to muted if browser blocks)
 * - Pauses automatically when scrolled out of view
 * - User can tap to pause/play and toggle mute
 * - preload="auto" for smooth playback
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
  autoShowControls = false,
}: LazyVideoProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const [browserBlockedAudio, setBrowserBlockedAudio] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build video source URL with time fragment for first frame
  const videoSrcWithTime = `${src}#t=0.001`;

  // Listen for first user interaction on the page to unlock audio
  useEffect(() => {
    if (!browserBlockedAudio || userMuted) return;

    const unlockAudio = () => {
      const video = videoRef.current;
      if (video && !userMuted) {
        video.muted = false;
        setIsMuted(false);
        setBrowserBlockedAudio(false);
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('scroll', unlockAudio);
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });
    document.addEventListener('scroll', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('scroll', unlockAudio);
    };
  }, [browserBlockedAudio, userMuted]);

  // IntersectionObserver - auto-play when visible, pause when not
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);

        const video = videoRef.current;
        if (!video) return;

        if (visible && !userPaused) {
          // Always try unmuted first (sound ON), unless user chose to mute
          if (!userMuted) {
            video.muted = false;
            setIsMuted(false);
          }
          video.play().catch(() => {
            // Browser blocked unmuted autoplay — fall back to muted but remember
            video.muted = true;
            setIsMuted(true);
            setBrowserBlockedAudio(true);
            video.play().catch(() => {});
          });
        } else if (!visible) {
          video.pause();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [userPaused, userMuted]);

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

  // Container click handler - toggle play/pause
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.target as HTMLElement;
    // Don't handle if clicking on mute button
    if (target.closest('[data-mute-btn]')) return;

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setUserPaused(true);
    } else {
      setUserPaused(false);
      video.play().catch(() => {
        video.muted = true;
        setIsMuted(true);
        video.play().catch(() => {});
      });
      setIsPlaying(true);
    }
  }, [isPlaying]);

  // Toggle mute
  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const video = videoRef.current;
    if (video) {
      const newMuted = !isMuted;
      video.muted = newMuted;
      setIsMuted(newMuted);
      setUserMuted(newMuted);
      if (!newMuted) setBrowserBlockedAudio(false);
    }
  }, [isMuted]);

  // Video ended handler - loop
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
        src={videoSrcWithTime}
        className={`w-full h-full object-cover ${className}`}
        muted={isMuted}
        playsInline
        preload="auto"
        poster={poster}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onSeeked={handleSeeked}
        onEnded={handleEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      {/* Mute toggle button - always visible */}
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
