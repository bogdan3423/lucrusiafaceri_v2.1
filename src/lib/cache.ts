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


// ==================== Video Cache ====================

interface CachedVideo {
  blobUrl: string;
  originalUrl: string;
  timestamp: number;
  size: number;
}

class VideoCacheService {
  private cache = new Map<string, CachedVideo>();
  private loadPromises = new Map<string, Promise<string | null>>();
  private preloadQueue: Array<{ url: string; priority: 'high' | 'low' }> = [];
  private isProcessing = false;
  private activeLoads = 0;
  
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB max cache
  private readonly MAX_CONCURRENT_LOADS = 2;
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour
  private currentCacheSize = 0;

  /**
   * Check if video is cached
   */
  isCached(url: string): boolean {
    const cached = this.cache.get(url);
    if (!cached) return false;
    
    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.removeFromCache(url);
      return false;
    }
    
    return true;
  }

  /**
   * Get cached blob URL for video
   */
  getCachedUrl(url: string): string | null {
    const cached = this.cache.get(url);
    if (!cached) return null;
    
    // Update timestamp on access
    cached.timestamp = Date.now();
    return cached.blobUrl;
  }

  /**
   * Preload video into cache
   */
  async preload(url: string, priority: 'high' | 'low' = 'low'): Promise<string | null> {
    if (!url) return null;

    // Already cached
    if (this.isCached(url)) {
      return this.getCachedUrl(url);
    }

    // Already loading - return existing promise
    const existingPromise = this.loadPromises.get(url);
    if (existingPromise) return existingPromise;

    if (priority === 'high' && this.activeLoads < this.MAX_CONCURRENT_LOADS) {
      return this.loadVideo(url);
    } else {
      // Add to queue
      const existing = this.preloadQueue.findIndex(item => item.url === url);
      if (existing === -1) {
        if (priority === 'high') {
          this.preloadQueue.unshift({ url, priority });
        } else {
          this.preloadQueue.push({ url, priority });
        }
      }
      this.processQueue();
      return null;
    }
  }

  /**
   * Load a single video
   */
  private loadVideo(url: string): Promise<string | null> {
    const promise = new Promise<string | null>(async (resolve) => {
      this.activeLoads++;
      
      try {
        const response = await fetch(url, { 
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch video');
        }
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Ensure we have space
        await this.ensureSpace(blob.size);
        
        // Cache the blob URL
        this.cache.set(url, {
          blobUrl,
          originalUrl: url,
          timestamp: Date.now(),
          size: blob.size,
        });
        this.currentCacheSize += blob.size;
        
        resolve(blobUrl);
      } catch (error) {
        // On error, just return null - video will load normally
        resolve(null);
      } finally {
        this.activeLoads--;
        this.loadPromises.delete(url);
        this.processQueue();
      }
    });

    this.loadPromises.set(url, promise);
    return promise;
  }

  /**
   * Ensure cache has space for new video
   */
  private async ensureSpace(neededSize: number): Promise<void> {
    while (this.currentCacheSize + neededSize > this.MAX_CACHE_SIZE && this.cache.size > 0) {
      // Remove oldest entry
      let oldestUrl: string | null = null;
      let oldestTimestamp = Infinity;
      
      this.cache.forEach((cached, url) => {
        if (cached.timestamp < oldestTimestamp) {
          oldestUrl = url;
          oldestTimestamp = cached.timestamp;
        }
      });
      
      if (oldestUrl) {
        this.removeFromCache(oldestUrl);
      } else {
        break;
      }
    }
  }

  /**
   * Remove video from cache
   */
  private removeFromCache(url: string): void {
    const cached = this.cache.get(url);
    if (cached) {
      URL.revokeObjectURL(cached.blobUrl);
      this.currentCacheSize -= cached.size;
      this.cache.delete(url);
    }
  }

  /**
   * Process the preload queue
   */
  private processQueue(): void {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.activeLoads < this.MAX_CONCURRENT_LOADS && this.preloadQueue.length > 0) {
      const item = this.preloadQueue.shift();
      if (item && !this.isCached(item.url)) {
        this.loadVideo(item.url);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Prioritize loading a specific video
   */
  prioritize(url: string): void {
    if (this.isCached(url)) return;
    
    // Remove from queue and add to front
    const idx = this.preloadQueue.findIndex(item => item.url === url);
    if (idx > -1) {
      this.preloadQueue.splice(idx, 1);
    }
    
    this.preload(url, 'high');
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();
    const toRemove: string[] = [];
    
    this.cache.forEach((cached, url) => {
      if (now - cached.timestamp > this.CACHE_TTL) {
        toRemove.push(url);
      }
    });
    
    toRemove.forEach(url => this.removeFromCache(url));
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.forEach((cached) => {
      URL.revokeObjectURL(cached.blobUrl);
    });
    this.cache.clear();
    this.preloadQueue = [];
    this.loadPromises.clear();
    this.currentCacheSize = 0;
  }
}

export const videoCache = new VideoCacheService();


// ==================== Cleanup Handlers ====================

// Cleanup on tab switch
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      imageCache.cleanup();
      videoCache.cleanup();
    }
  });
  
  // Periodic cleanup every 5 minutes
  setInterval(() => {
    imageCache.cleanup();
    videoCache.cleanup();
  }, 5 * 60 * 1000);
}
