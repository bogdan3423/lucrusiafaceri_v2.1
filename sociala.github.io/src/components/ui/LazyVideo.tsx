'use client';

/**
 * Lazy Video Component - Reliable Auto-Play with Sound
 * 
 * KEY PRINCIPLES:
 * - Only renders <video> when near viewport (300px margin) — saves bandwidth
 * - Always starts MUTED for guaranteed autoplay (browsers allow muted autoplay)
 * - Immediately tries to unmute after play starts
 * - Uses onCanPlay to trigger play when video data is actually ready
 * - Single IntersectionObserver on the container for play/pause
 * - Pauses when scrolled out, resumes when scrolled back in
 * - User can tap to pause/play and toggle mute
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
  const [isMuted, setIsMuted] = useState(true); // Start muted for guaranteed autoplay
  const [isNearView, setIsNearView] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [userMuted, setUserMuted] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isInViewRef = useRef(false);
  const userPausedRef = useRef(false);
  const userMutedRef = useRef(false);

  // Keep refs in sync for use inside callbacks/observers
  useEffect(() => { isInViewRef.current = isInView; }, [isInView]);
  useEffect(() => { userPausedRef.current = userPaused; }, [userPaused]);
  useEffect(() => { userMutedRef.current = userMuted; }, [userMuted]);

  // Try to unmute a playing video
  const tryUnmute = useCallback((video: HTMLVideoElement) => {
    if (userMutedRef.current) return; // User chose mute, respect it
    try {
      video.muted = false;
      setIsMuted(false);
    } catch {
      // Browser blocked unmute, stay muted
      video.muted = true;
      setIsMuted(true);
    }
  }, []);

  // Core play function — always muted first, then try unmute
  const startPlayback = useCallback((video: HTMLVideoElement) => {
    video.preload = 'auto';
    // Always start muted — browsers guarantee this works
    video.muted = true;
    setIsMuted(true);
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        // Playing! Now try to unmute
        tryUnmute(video);
      }).catch(() => {
        // Even muted play failed (very rare) — do nothing
      });
    }
  }, [tryUnmute]);

  // Listen for first user interaction to unlock audio
  useEffect(() => {
    const unlockAudio = () => {
      const video = videoRef.current;
      if (video && !userMutedRef.current && video.muted) {
        video.muted = false;
        setIsMuted(false);
      }
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  // Observer: Detect when container is NEAR viewport — mount the <video> element
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsNearView(entry.isIntersecting);
      },
      { rootMargin: '300px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Observer: Detect when container is 40% visible — play/pause
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setIsInView(visible);

        const video = videoRef.current;
        if (!video) return;

        if (visible && !userPausedRef.current) {
          startPlayback(video);
        } else if (!visible) {
          video.pause();
          video.preload = 'metadata';
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [startPlayback]);

  // When video becomes ready AND is in view — auto-play
  // This handles the race condition: video mounts after observer already fired
  const handleCanPlay = useCallback(() => {
    setVideoReady(true);
    const video = videoRef.current;
    if (video && isInViewRef.current && !userPausedRef.current) {
      startPlayback(video);
    }
  }, [startPlayback]);

  // Handle metadata loaded - seek to get first frame
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (video && video.currentTime === 0) {
      video.currentTime = 0.001;
    }
  }, []);

  // Container click handler - toggle play/pause
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const target = e.target as HTMLElement;
    if (target.closest('[data-mute-btn]')) return;

    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
      setUserPaused(true);
    } else {
      setUserPaused(false);
      startPlayback(video);
    }
  }, [isPlaying, startPlayback]);

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
      {/* Only render video element when near viewport */}
      {isNearView ? (
        <video
          ref={videoRef}
          src={`${src}#t=0.001`}
          className={`w-full h-full object-cover ${className}`}
          muted={isMuted}
          playsInline
          preload="metadata"
          poster={poster}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onEnded={handleEnded}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      ) : (
        poster ? (
          <img src={poster} className={`w-full h-full object-cover ${className}`} alt="" />
        ) : (
          <div className="w-full h-full bg-gray-900" />
        )
      )}

      {/* Mute toggle button */}
      {isNearView && (
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
