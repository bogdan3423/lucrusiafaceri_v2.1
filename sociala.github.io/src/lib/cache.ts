'use client';

/**
 * Cache System - Simplified for Post Data
 * 
 * KEY PRINCIPLES:
 * - Posts cache for instant page loads
 * - Session storage persistence
 * - Stale-while-revalidate pattern
 * 
 * NOTE: Image and video caching is now handled by the browser's native
 * caching mechanisms using proper loading attributes and preload hints.
 */

import { Post } from '@/types';

// ==================== Posts Cache ====================

interface PostsCacheEntry {
  posts: Post[];
  lastDoc: any;
  timestamp: number;
  stale: boolean;
}

class PostsCacheService {
  private cache = new Map<string, PostsCacheEntry>();
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes fresh
  private readonly STALE_TTL = 10 * 60 * 1000; // 10 minutes stale-while-revalidate
  private readonly STORAGE_KEY = 'posts_cache_v2';
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initFromStorage();
      this.setupVisibilityHandler();
    }
  }

  private initFromStorage() {
    if (this.initialized) return;
    this.initialized = true;
    
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        
        Object.entries(data).forEach(([key, entry]: [string, any]) => {
          if (
            entry && 
            Array.isArray(entry.posts) && 
            entry.posts.length > 0 &&
            now - entry.timestamp < this.STALE_TTL
          ) {
            this.cache.set(key, {
              ...entry,
              stale: now - entry.timestamp > this.CACHE_TTL,
            });
          }
        });
      }
    } catch {
      try {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch {}
    }
  }

  private persistToStorage() {
    try {
      const data: Record<string, PostsCacheEntry> = {};
      this.cache.forEach((entry, key) => {
        if (!entry.stale) {
          data[key] = entry;
        }
      });
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }

  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.persistToStorage();
      } else {
        const now = Date.now();
        this.cache.forEach((entry) => {
          if (now - entry.timestamp > this.CACHE_TTL) {
            entry.stale = true;
          }
        });
      }
    });
  }

  /**
   * Get cached posts
   */
  get(key: string): { posts: Post[]; lastDoc: any; needsRefresh: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > this.STALE_TTL) {
      this.cache.delete(key);
      return null;
    }

    if (age > this.CACHE_TTL || entry.stale) {
      return { posts: entry.posts, lastDoc: entry.lastDoc, needsRefresh: true };
    }

    return { posts: entry.posts, lastDoc: entry.lastDoc, needsRefresh: false };
  }

  /**
   * Set cached posts
   */
  set(key: string, posts: Post[], lastDoc: any) {
    this.cache.set(key, {
      posts,
      lastDoc,
      timestamp: Date.now(),
      stale: false,
    });
    this.persistToStorage();
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch {}
  }

  /**
   * Clear specific key
   */
  invalidate(key: string) {
    this.cache.delete(key);
  }
}

export const postsCache = new PostsCacheService();
