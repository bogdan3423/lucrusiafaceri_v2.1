'use client';

/**
 * Image Cache Service
 * Global cache for image URLs and preloaded images
 * Prevents repeated fetches and enables instant display
 */

interface CachedImage {
  url: string;
  blob?: Blob;
  objectUrl?: string;
  loaded: boolean;
  loading: boolean;
  error: boolean;
  timestamp: number;
}

class ImageCacheService {
  private cache: Map<string, CachedImage> = new Map();
  private preloadQueue: Set<string> = new Set();
  private observedElements: Map<string, HTMLElement> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 200;
  private readonly CONCURRENT_LOADS = 4;
  private activeLoads = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initIntersectionObserver();
    }
  }

  private initIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const url = entry.target.getAttribute('data-src');
          if (url && entry.isIntersecting) {
            this.prioritizeLoad(url);
          }
        });
      },
      {
        rootMargin: '200px', // Start loading 200px before visible
        threshold: 0,
      }
    );
  }

  /**
   * Get cached image status
   */
  getStatus(url: string): CachedImage | undefined {
    return this.cache.get(url);
  }

  /**
   * Check if image is cached and loaded
   */
  isLoaded(url: string): boolean {
    const cached = this.cache.get(url);
    return cached?.loaded === true;
  }

  /**
   * Preload an image with priority
   */
  async preload(url: string, priority: 'high' | 'low' = 'low'): Promise<boolean> {
    if (!url) return false;

    const cached = this.cache.get(url);
    if (cached?.loaded) return true;
    if (cached?.loading) return false;

    // Add to cache as loading
    this.cache.set(url, {
      url,
      loaded: false,
      loading: true,
      error: false,
      timestamp: Date.now(),
    });

    if (priority === 'high') {
      return this.loadImage(url);
    } else {
      this.preloadQueue.add(url);
      this.processQueue();
      return false;
    }
  }

  /**
   * Load image immediately
   */
  private async loadImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      
      img.onload = () => {
        const cached = this.cache.get(url);
        if (cached) {
          cached.loaded = true;
          cached.loading = false;
          cached.timestamp = Date.now();
        }
        this.activeLoads--;
        this.processQueue();
        resolve(true);
      };

      img.onerror = () => {
        const cached = this.cache.get(url);
        if (cached) {
          cached.error = true;
          cached.loading = false;
        }
        this.activeLoads--;
        this.processQueue();
        resolve(false);
      };

      this.activeLoads++;
      img.src = url;
    });
  }

  /**
   * Process the preload queue
   */
  private processQueue() {
    while (this.activeLoads < this.CONCURRENT_LOADS && this.preloadQueue.size > 0) {
      const url = this.preloadQueue.values().next().value;
      if (url) {
        this.preloadQueue.delete(url);
        this.loadImage(url);
      }
    }
  }

  /**
   * Prioritize loading a specific URL (move to front of queue)
   */
  prioritizeLoad(url: string) {
    if (this.isLoaded(url)) return;
    
    // Remove from queue and load immediately
    this.preloadQueue.delete(url);
    this.preload(url, 'high');
  }

  /**
   * Observe an element for viewport visibility
   */
  observe(element: HTMLElement, url: string) {
    if (!this.intersectionObserver || !url) return;
    
    element.setAttribute('data-src', url);
    this.observedElements.set(url, element);
    this.intersectionObserver.observe(element);
  }

  /**
   * Stop observing an element
   */
  unobserve(element: HTMLElement, url: string) {
    if (!this.intersectionObserver) return;
    
    this.intersectionObserver.unobserve(element);
    this.observedElements.delete(url);
  }

  /**
   * Preload multiple images with priority for visible ones
   */
  preloadBatch(urls: string[], priorityIndices: number[] = [0]) {
    urls.forEach((url, index) => {
      const priority = priorityIndices.includes(index) ? 'high' : 'low';
      this.preload(url, priority);
    });
  }

  /**
   * Clean up old cache entries
   */
  cleanup() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    // Remove expired entries
    entries.forEach(([url, data]) => {
      if (now - data.timestamp > this.CACHE_TTL) {
        if (data.objectUrl) {
          URL.revokeObjectURL(data.objectUrl);
        }
        this.cache.delete(url);
      }
    });

    // If still over max size, remove oldest
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const sorted = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = sorted.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toRemove.forEach(([url, data]) => {
        if (data.objectUrl) {
          URL.revokeObjectURL(data.objectUrl);
        }
        this.cache.delete(url);
      });
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.forEach((data) => {
      if (data.objectUrl) {
        URL.revokeObjectURL(data.objectUrl);
      }
    });
    this.cache.clear();
    this.preloadQueue.clear();
  }
}

// Singleton instance
export const imageCache = new ImageCacheService();

// Cleanup on visibility change (when user leaves tab)
if (typeof window !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      imageCache.cleanup();
    }
  });
}
