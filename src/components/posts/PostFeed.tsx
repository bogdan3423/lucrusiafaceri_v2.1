'use client';

/**
 * Post Feed Component
 * Displays posts with infinite scroll pagination
 * Premium loading: images appear only when fully ready
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { Loader2, RefreshCw } from 'lucide-react';
import { Post, CategoryKey } from '@/types';
import { fetchPosts, fetchAllPosts } from '@/services/postsService';
import PostCard from '@/components/posts/PostCard';
import { imageCache } from '@/lib/imageCache';

interface PostFeedProps {
  category?: CategoryKey | null;
  initialPosts?: Post[];
  userId?: string; // When provided, only shows posts from this user (no infinite scroll)
}

// Extract all image URLs from posts for preloading
function extractImageUrls(posts: Post[]): string[] {
  const urls: string[] = [];
  posts.forEach(post => {
    if (post.media?.length) {
      post.media.forEach(m => {
        if (m.type === 'image' && m.url) urls.push(m.url);
      });
    } else if (post.images?.length) {
      urls.push(...post.images);
    }
  });
  return urls;
}

// Preload images before rendering
async function preloadPostImages(posts: Post[], priorityCount = 4): Promise<void> {
  const urls = extractImageUrls(posts);
  
  // Preload priority images (first few posts) with high priority
  const priorityUrls = urls.slice(0, priorityCount * 2); // ~2 images per post
  const promises = priorityUrls.map(url => imageCache.preload(url, 'high'));
  
  // Queue remaining for background loading
  urls.slice(priorityCount * 2).forEach(url => imageCache.preload(url, 'low'));
  
  // Wait for priority images to load
  await Promise.all(promises);
}

interface PostFeedProps {
  category?: CategoryKey | null;
  initialPosts?: Post[];
  userId?: string; // When provided, only shows posts from this user (no infinite scroll)
}

export default function PostFeed({ category, initialPosts = [], userId }: PostFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(!userId); // Disable infinite scroll for user-specific feeds
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Preload images when posts change
  useEffect(() => {
    if (posts.length > 0) {
      // Preload first 4 posts with high priority, rest in background
      preloadPostImages(posts.slice(0, 8), 4);
    }
  }, [posts]);

  // Load initial posts (skip if userId is provided - those are passed via initialPosts)
  const loadPosts = useCallback(async () => {
    if (userId) {
      // For user-specific feeds, posts are already provided via initialPosts
      return;
    }
    
    setIsLoading(true);
    setIsPreloading(true);
    setError(null); 
    
    try {
      const result = category 
        ? await fetchPosts(category, null)
        : await fetchAllPosts(null);
      
      // Deduplicate posts by ID
      const uniquePosts = result.posts.filter((post, index, self) => 
        index === self.findIndex(p => p.id === post.id)
      );
      
      // Preload images for first 4 posts before showing
      await preloadPostImages(uniquePosts.slice(0, 4), 4);
      
      setPosts(uniquePosts);
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      setError('Eroare la încărcarea postărilor. Încearcă din nou.');
      console.error('Error loading posts:', err);
    } finally {
      setIsLoading(false);
      setIsPreloading(false);
    }
  }, [category, userId]);

  // Load more posts (pagination) - disabled for user-specific feeds
  const loadMorePosts = useCallback(async () => {
    if (isLoadingMore || !hasMore || userId) return;
    
    setIsLoadingMore(true);
    
    try {
      const result = category 
        ? await fetchPosts(category, lastDoc)
        : await fetchAllPosts(lastDoc);
      
      // Deduplicate posts by ID
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPosts = result.posts.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPosts];
      });
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (err) {
      console.error('Error loading more posts:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [category, lastDoc, hasMore, isLoadingMore]);

  // Initial load
  useEffect(() => {
    if (initialPosts.length === 0) {
      loadPosts();
    }
  }, [loadPosts, initialPosts.length]);

  // Set up infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMorePosts();
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, loadMorePosts]);

  // Refresh handler
  const handleRefresh = () => {
    setPosts([]);
    setLastDoc(null);
    setHasMore(true);
    loadPosts();
  };

  // Loading state
  if (isLoading && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500">Se încarcă postările...</p>
      </div>
    );
  }

  // Error state
  if (error && posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Încearcă din nou</span>
        </button>
      </div>
    );
  }

  // Empty state
  if (!isLoading && posts.length === 0) {
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
    <div className="w-full md:max-w-xl lg:max-w-2xl md:mx-auto">
      {/* Refresh button */}
      <div className="flex justify-end mb-2 px-3 md:px-0">
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizează</span>
        </button>
      </div>

      {/* Posts feed - Mobile-first immersive vertical layout */}
      <div className="flex flex-col">
        {posts.map((post, index) => (
          <PostCard key={`${post.id}-${index}`} post={post} />
        ))}
      </div>

      {/* Load more sentinel */}
      <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
        {isLoadingMore && (
          <div className="flex items-center space-x-2 text-gray-500">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Se încarcă mai multe...</span>
          </div>
        )}
        {!hasMore && posts.length > 0 && (
          <p className="text-gray-400 text-sm">Ai ajuns la final 🎉</p>
        )}
      </div>
    </div>
  );
}
