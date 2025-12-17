'use client';

/**
 * Unified Cache System
 * High-performance caching for posts and images
 * - In-memory cache with LRU eviction
 * - Session storage persistence for instant page loads
 * - Background refresh for stale data
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
  private readonly STORAGE_KEY = 'posts_cache_v1';
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
        
        // Restore non-expired entries with valid posts arrays
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
    } catch (e) {
      // Storage not available or corrupted - clear it
      try {
        sessionStorage.removeItem(this.STORAGE_KEY);
      } catch {}
    }
  }

  private persistToStorage() {
    try {
      const data: Record<string, PostsCacheEntry> = {};
      this.cache.forEach((entry, key) => {
        // Only persist fresh entries
        if (!entry.stale) {
          data[key] = entry;
        }
      });
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage full or not available
    }
  }

  private setupVisibilityHandler() {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Save to storage when leaving
        this.persistToStorage();
      } else {
        // Mark entries as potentially stale when returning
        const now = Date.now();
        this.cache.forEach((entry, key) => {
          if (now - entry.timestamp > this.CACHE_TTL) {
            entry.stale = true;
          }
        });
      }
    });
  }

  /**
   * Get cached posts - returns immediately if available
   * Returns { posts, needsRefresh } where needsRefresh indicates background refresh needed
   */
  get(key: string): { posts: Post[]; lastDoc: any; needsRefresh: boolean } | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    const age = now - entry.timestamp;

    // Expired completely
    if (age > this.STALE_TTL) {
      this.cache.delete(key);
      return null;
    }

    // Stale but usable - signal for background refresh
    if (age > this.CACHE_TTL || entry.stale) {
      return { posts: entry.posts, lastDoc: entry.lastDoc, needsRefresh: true };
    }

    // Fresh
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

    // Persist top entries
    this.persistToStorage();
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {}
  }

  /**
   * Clear specific key
   */
  invalidate(key: string) {
    this.cache.delete(key);
  }
}

export const postsCache = new PostsCacheService();


// ==================== Image Cache ====================

interface CachedImage {
  loaded: boolean;
  loading: boolean;
  error: boolean;
  timestamp: number;
}

class ImageCacheService {
  private cache = new Map<string, CachedImage>();
  private loadPromises = new Map<string, Promise<boolean>>();
  private preloadQueue: string[] = [];
  private isProcessing = false;
  
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 300;
  private readonly CONCURRENT_LOADS = 6; // Reasonable concurrency
  private activeLoads = 0;

  /**
   * Check if image is already loaded
   */
  isLoaded(url: string): boolean {
    const cached = this.cache.get(url);
    return cached?.loaded === true;
  }

  /**
   * Preload an image
   */
  async preload(url: string, priority: 'high' | 'low' = 'low'): Promise<boolean> {
    if (!url) return false;

    // Already loaded
    if (this.isLoaded(url)) return true;
    
    // Already loading - return existing promise
    const existingPromise = this.loadPromises.get(url);
    if (existingPromise) return existingPromise;

    // Mark as loading
    this.cache.set(url, {
      loaded: false,
      loading: true,
      error: false,
      timestamp: Date.now(),
    });

    if (priority === 'high') {
      // Load immediately
      return this.loadImage(url);
    } else {
      // Add to queue
      if (!this.preloadQueue.includes(url)) {
        this.preloadQueue.push(url);
      }
      this.processQueue();
      return false;
    }
  }

  /**
   * Load a single image
   */
  private loadImage(url: string): Promise<boolean> {
    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      
      const cleanup = () => {
        this.activeLoads--;
        this.loadPromises.delete(url);
        this.processQueue();
      };

      img.onload = () => {
        const cached = this.cache.get(url);
        if (cached) {
          cached.loaded = true;
          cached.loading = false;
          cached.timestamp = Date.now();
        }
        cleanup();
        resolve(true);
      };

      img.onerror = () => {
        const cached = this.cache.get(url);
        if (cached) {
          cached.error = true;
          cached.loading = false;
        }
        cleanup();
        resolve(false);
      };

      this.activeLoads++;
      img.src = url;
    });

    this.loadPromises.set(url, promise);
    return promise;
  }

  /**
   * Process the preload queue
   */
  private processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.activeLoads < this.CONCURRENT_LOADS && this.preloadQueue.length > 0) {
      const url = this.preloadQueue.shift();
      if (url && !this.isLoaded(url)) {
        this.loadImage(url);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Preload batch of images
   */
  preloadBatch(urls: string[], priorityIndices: number[] = [0]) {
    urls.forEach((url, index) => {
      const priority = priorityIndices.includes(index) ? 'high' : 'low';
      this.preload(url, priority);
    });
  }

  /**
   * Prioritize a specific URL
   */
  prioritize(url: string) {
    if (this.isLoaded(url)) return;
    
    // Remove from queue if present
    const idx = this.preloadQueue.indexOf(url);
    if (idx > -1) {
      this.preloadQueue.splice(idx, 1);
    }
    
    // Load immediately
    this.preload(url, 'high');
  }

  /**
   * Clean up old entries
   */
  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired
    entries.forEach(([url, data]) => {
      if (now - data.timestamp > this.CACHE_TTL) {
        this.cache.delete(url);
      }
    });

    // Evict if over size limit (LRU)
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sorted = entries
        .filter(([url]) => this.cache.has(url))
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sorted.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([url]) => this.cache.delete(url));
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
    this.preloadQueue = [];
    this.loadPromises.clear();
  }
}

export const imageCache = new ImageCacheService();

// Cleanup on tab switch
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      imageCache.cleanup();
    }
  });
  
  // Periodic cleanup every 5 minutes
  setInterval(() => {
    imageCache.cleanup();
  }, 5 * 60 * 1000);
}
