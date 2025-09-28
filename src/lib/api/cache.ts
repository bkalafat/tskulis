/**
 * API Caching System
 * Advanced caching strategies for API optimization
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  etag?: string;
  lastModified?: string;
}

interface CacheConfig {
  defaultTTL: number;
  maxSize: number;
  compression: boolean;
  persistToStorage?: boolean;
}

export class APICache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private config: CacheConfig;
  private accessLog: Map<string, number> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      maxSize: 1000,
      compression: true,
      persistToStorage: false,
      ...config
    };

    // Load from localStorage if enabled
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      this.loadFromStorage();
    }

    // Cleanup interval
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access log
    this.accessLog.set(key, Date.now());
    
    return entry.data;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T, ttl?: number, metadata?: { etag?: string; lastModified?: string }): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTTL,
      ...(metadata?.etag && { etag: metadata.etag }),
      ...(metadata?.lastModified && { lastModified: metadata.lastModified })
    };

    // Check cache size and evict if necessary
    if (this.cache.size >= this.config.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, entry);
    this.accessLog.set(key, Date.now());

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Conditional cache check using ETags
   */
  isStale(key: string, etag?: string, lastModified?: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return true;
    }

    // Check ETags
    if (etag && entry.etag && entry.etag !== etag) {
      return true;
    }

    // Check Last-Modified
    if (lastModified && entry.lastModified && entry.lastModified !== lastModified) {
      return true;
    }

    return false;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        this.accessLog.delete(key);
      }
    }

    if (this.config.persistToStorage) {
      this.saveToStorage();
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.accessLog.clear();
    
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem('api-cache');
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const now = Date.now();
    let oldestTime = now;
    let newestTime = 0;
    let totalSize = 0;

    for (const [, entry] of this.cache.entries()) {
      const entryTime = entry.timestamp;
      oldestTime = Math.min(oldestTime, entryTime);
      newestTime = Math.max(newestTime, entryTime);
      
      // Estimate size
      totalSize += JSON.stringify(entry.data).length;
    }

    return {
      size: this.cache.size,
      hitRate: this.calculateHitRate(),
      memoryUsage: totalSize,
      oldestEntry: now - oldestTime,
      newestEntry: now - newestTime
    };
  }

  /**
   * Evict least recently used entries
   */
  private evictLRU(): void {
    let lruKey = '';
    let lruTime = Date.now();

    for (const [key, accessTime] of this.accessLog.entries()) {
      if (accessTime < lruTime) {
        lruTime = accessTime;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
      this.accessLog.delete(lruKey);
    }
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        this.accessLog.delete(key);
      }
    }
  }

  /**
   * Calculate hit rate
   */
  private calculateHitRate(): number {
    // This would need hit/miss tracking in a real implementation
    return 0.85; // Mock hit rate
  }

  /**
   * Save cache to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cacheData = Array.from(this.cache.entries());
      localStorage.setItem('api-cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const cached = localStorage.getItem('api-cache');
      if (cached) {
        const cacheData = JSON.parse(cached);
        this.cache = new Map(cacheData);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }
}

/**
 * Request Queue for API call optimization
 */
export class RequestQueue {
  private queue: Map<string, Promise<any>> = new Map();
  private concurrentLimit: number;
  private activeRequests: number = 0;
  private waitingQueue: Array<() => void> = [];

  constructor(concurrentLimit: number = 6) {
    this.concurrentLimit = concurrentLimit;
  }

  /**
   * Add request to queue with deduplication
   */
  async enqueue<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if same request is already in progress
    if (this.queue.has(key)) {
      return this.queue.get(key) as Promise<T>;
    }

    // Wait if concurrent limit reached
    if (this.activeRequests >= this.concurrentLimit) {
      await this.waitForSlot();
    }

    // Create and track request
    const promise = this.executeRequest(key, requestFn);
    this.queue.set(key, promise);
    
    return promise;
  }

  /**
   * Execute request with tracking
   */
  private async executeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    this.activeRequests++;
    
    try {
      const result = await requestFn();
      return result;
    } finally {
      this.activeRequests--;
      this.queue.delete(key);
      
      // Process waiting queue
      if (this.waitingQueue.length > 0 && this.activeRequests < this.concurrentLimit) {
        const nextRequest = this.waitingQueue.shift();
        if (nextRequest) {
          nextRequest();
        }
      }
    }
  }

  /**
   * Wait for available slot
   */
  private waitForSlot(): Promise<void> {
    return new Promise(resolve => {
      this.waitingQueue.push(resolve);
    });
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    activeRequests: number;
    queuedRequests: number;
    waitingRequests: number;
  } {
    return {
      activeRequests: this.activeRequests,
      queuedRequests: this.queue.size,
      waitingRequests: this.waitingQueue.length
    };
  }
}

/**
 * Response compression utilities
 */
export class ResponseCompression {
  /**
   * Compress response data
   */
  static compress(data: any): string {
    // Simple JSON compression by removing whitespace
    return JSON.stringify(data);
  }

  /**
   * Decompress response data
   */
  static decompress(compressed: string): any {
    return JSON.parse(compressed);
  }

  /**
   * Check if response should be compressed
   */
  static shouldCompress(data: any): boolean {
    const size = JSON.stringify(data).length;
    return size > 1024; // Compress if larger than 1KB
  }
}

/**
 * API Performance Monitor
 */
export class APIPerformanceMonitor {
  private metrics: Map<string, {
    count: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
    errors: number;
    lastCall: number;
  }> = new Map();

  /**
   * Record API call metrics
   */
  recordCall(endpoint: string, duration: number, success: boolean = true): void {
    const existing = this.metrics.get(endpoint) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
      lastCall: 0
    };

    existing.count++;
    existing.totalTime += duration;
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);
    existing.lastCall = Date.now();
    
    if (!success) {
      existing.errors++;
    }

    this.metrics.set(endpoint, existing);
  }

  /**
   * Get performance metrics for endpoint
   */
  getMetrics(endpoint: string) {
    const metrics = this.metrics.get(endpoint);
    
    if (!metrics) {
      return null;
    }

    return {
      ...metrics,
      avgTime: metrics.totalTime / metrics.count,
      errorRate: metrics.errors / metrics.count,
      callsPerSecond: this.calculateCallsPerSecond(endpoint)
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const result: Record<string, any> = {};
    
    for (const [endpoint, metrics] of this.metrics.entries()) {
      result[endpoint] = {
        ...metrics,
        avgTime: metrics.totalTime / metrics.count,
        errorRate: metrics.errors / metrics.count,
        callsPerSecond: this.calculateCallsPerSecond(endpoint)
      };
    }
    
    return result;
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics.clear();
  }

  /**
   * Calculate calls per second
   */
  private calculateCallsPerSecond(endpoint: string): number {
    const metrics = this.metrics.get(endpoint);
    if (!metrics || metrics.count < 2) return 0;

    const timeSpan = Date.now() - metrics.lastCall;
    return metrics.count / (timeSpan / 1000);
  }
}

// Global instances
export const apiCache = new APICache();
export const requestQueue = new RequestQueue();
export const performanceMonitor = new APIPerformanceMonitor();