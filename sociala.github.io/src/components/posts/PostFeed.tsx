'use client';

/**
 * Post Feed Component - Premium Instagram/Facebook-style Loading
 * 
 * KEY PRINCIPLES:
 * - Posts appear INSTANTLY (no loading states visible)
 * - Images load fast with reserved space (no layout shift)
 * - Videos show first frame immediately (no placeholders)
 * - Smooth infinite scroll with prefetching
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { RefreshCw } from 'lucide-react';
import { Post, CategoryKey } from '@/types';
import { fetchPosts, fetchAllPosts } from '@/services/postsService';
import PostCard from '@/components/posts/PostCard';
import { preloadImages } from '@/components/ui/OptimizedImage';

// Constants
const INITIAL_LOAD_COUNT = 5;
const PREFETCH_THRESHOLD = 800;

// Helper to extract ALL image URLs from posts for preloading
const extractImageUrls = (posts: Post[]): string[] => {
  const urls: string[] = [];
  for (const post of posts) {
    const images = post.media?.filter(m => m.type === 'image') || [];
    const imageUrls = post.images || [];
    
    // Get URLs from media array first
    for (const img of images) {
      urls.push(img.url);
    }
    
    // Fallback to images array
    if (images.length === 0) {
      for (const url of imageUrls) {
        urls.push(url);
      }
    }
  }
  return urls;
};

interface PostFeedProps {
  category?: CategoryKey | null;
  initialPosts?: Post[];
  userId?: string;
}

export default function PostFeed({ category, initialPosts = [], userId }: PostFeedProps) {
  // Core state
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(!userId);
  const [isInitialLoad, setIsInitialLoad] = useState(initialPosts.length === 0);
  const [isPrefetching, setIsPrefetching] = useState(false);
  
  // Refs
  const feedRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasInitializedRef = useRef(false);
  const prefetchedPostsRef = useRef<Post[]>([]);
  const prefetchedLastDocRef = useRef<QueryDocumentSnapshot | null>(null);
  const prefetchHasMoreRef = useRef<boolean>(true);

  // Deduplicate posts by ID
  const deduplicatePosts = useCallback((newPosts: Post[], existing: Post[]): Post[] => {
    const existingIds = new Set(existing.map(p => p.id));
    return newPosts.filter(p => !existingIds.has(p.id));
  }, []);

  // Load initial posts
  const loadInitialPosts = useCallback(async () => {
    if (userId || hasInitializedRef.current) return;
    hasInitializedRef.current = true;
    
    try {
      const result = category 
        ? await fetchPosts(category, null)
        : await fetchAllPosts(null);
      
      const postsArray = Array.isArray(result.posts) ? result.posts : [];
      
      // Preload ALL images from posts for instant display
      const imageUrls = extractImageUrls(postsArray);
      if (imageUrls.length > 0) {
        preloadImages(imageUrls);
      }
      
      setPosts(postsArray);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('Error loading posts:', err);
      setIsInitialLoad(false);
    }
  }, [category, userId]);

  // Prefetch next batch (runs in background)
  const prefetchNextBatch = useCallback(async () => {
    if (isPrefetching || !hasMore || userId || prefetchedPostsRef.current.length > 0) return;
    
    setIsPrefetching(true);
    
    try {
      const result = category 
        ? await fetchPosts(category, lastDoc)
        : await fetchAllPosts(lastDoc);
      
      const postsArray = Array.isArray(result.posts) ? result.posts : [];
      prefetchedPostsRef.current = postsArray;
      prefetchedLastDocRef.current = result.lastDoc;
      prefetchHasMoreRef.current = result.hasMore;
      
      // Preload ALL images from prefetched posts in background
      const imageUrls = extractImageUrls(postsArray);
      if (imageUrls.length > 0) {
        preloadImages(imageUrls);
      }
    } catch (err) {
      console.error('Error prefetching posts:', err);
    } finally {
      setIsPrefetching(false);
    }
  }, [category, lastDoc, hasMore, isPrefetching, userId]);

  // Load more posts (uses prefetched data if available)
  const loadMorePosts = useCallback(() => {
    if (!hasMore || userId) return;
    
    // Use prefetched posts if available
    if (prefetchedPostsRef.current.length > 0) {
      const newPosts = deduplicatePosts(prefetchedPostsRef.current, posts);
      setPosts(prev => [...prev, ...newPosts]);
      setLastDoc(prefetchedLastDocRef.current);
      setHasMore(prefetchHasMoreRef.current);
      
      // Clear prefetched data
      prefetchedPostsRef.current = [];
      prefetchedLastDocRef.current = null;
      
      return;
    }
    
    // Fallback: fetch directly
    const fetchMore = async () => {
      try {
        const result = category 
          ? await fetchPosts(category, lastDoc)
          : await fetchAllPosts(lastDoc);
        
        const postsArray = Array.isArray(result.posts) ? result.posts : [];
        const newPosts = deduplicatePosts(postsArray, posts);
        
        setPosts(prev => [...prev, ...newPosts]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error('Error loading more posts:', err);
      }
    };
    
    fetchMore();
  }, [category, lastDoc, hasMore, posts, deduplicatePosts, userId]);

  // Initialize on mount
  useEffect(() => {
    if (initialPosts.length === 0 && !userId) {
      loadInitialPosts();
    } else {
      setIsInitialLoad(false);
    }
  }, [loadInitialPosts, initialPosts.length, userId]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || userId) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore) {
          loadMorePosts();
        }
      },
      {
        rootMargin: `${PREFETCH_THRESHOLD}px`,
        threshold: 0,
      }
    );
    
    observer.observe(sentinelRef.current);
    
    return () => observer.disconnect();
  }, [hasMore, loadMorePosts, userId]);

  // Prefetch when scrolling near bottom
  useEffect(() => {
    if (!hasMore || userId) return;
    
    const handleScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      
      if (docHeight - scrollBottom < PREFETCH_THRESHOLD * 2) {
        prefetchNextBatch();
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, prefetchNextBatch, userId]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    hasInitializedRef.current = false;
    prefetchedPostsRef.current = [];
    prefetchedLastDocRef.current = null;
    setPosts([]);
    setLastDoc(null);
    setHasMore(!userId);
    setIsInitialLoad(true);
    
    setTimeout(() => {
      loadInitialPosts();
    }, 100);
  }, [loadInitialPosts, userId]);

  // Memoize post cards for performance
  const postCards = useMemo(() => (
    posts.map((post, index) => (
      <PostCard 
        key={post.id} 
        post={post} 
        priority={index < 3}
      />
    ))
  ), [posts]);

  // Initial loading - show minimal skeleton
  if (isInitialLoad && posts.length === 0) {
    return (
      <div className="w-full md:max-w-xl lg:max-w-2xl md:mx-auto">
        <div className="flex flex-col">
          {[1, 2, 3].map((i) => (
            <div 
              key={i} 
              className="bg-white md:rounded-2xl md:shadow-sm md:border md:border-gray-100 overflow-hidden border-b-8 border-gray-100 md:border-b-0 md:mb-6 animate-pulse"
            >
              <div className="px-3 py-3 md:p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-32 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="aspect-square sm:aspect-[4/3] bg-gray-200" />
              <div className="px-3 py-3 md:px-4">
                <div className="h-5 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (!isInitialLoad && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-4xl">📭</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Nicio postare
        </h3>
        <p className="text-gray-500 max-w-sm">
          Nu există postări în această categorie. Fii primul care adaugă o postare!
        </p>
      </div>
    );
  }

  return (
    <div ref={feedRef} className="w-full md:max-w-xl lg:max-w-2xl md:mx-auto">
      {/* Refresh button */}
      <div className="flex justify-end mb-2 px-3 md:px-0">
        <button
          onClick={handleRefresh}
          disabled={isInitialLoad}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isInitialLoad ? 'animate-spin' : ''}`} />
          <span>Actualizează</span>
        </button>
      </div>

      {/* Posts feed */}
      <div className="flex flex-col">
        {postCards}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-10 flex items-center justify-center">
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-400 text-sm">Ai ajuns la final 🎉</p>
        )}
      </div>
    </div>
  );
}
