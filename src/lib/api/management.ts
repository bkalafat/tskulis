/**
 * API Versioning and Rate Limiting System
 * Advanced API management with versioning, rate limiting, and throttling
 */

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  message?: string;
}

interface VersionConfig {
  version: string;
  deprecated?: boolean;
  supportedUntil?: Date;
  migrationGuide?: string;
}

/**
 * Rate Limiter with sliding window algorithm
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      message: 'Too many requests',
      ...config
    };

    // Cleanup old requests every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if request is allowed
   */
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];
    
    // Remove requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if within limit
    const allowed = requests.length < this.config.maxRequests;
    const remaining = Math.max(0, this.config.maxRequests - requests.length);
    const resetTime = requests.length > 0 ? 
      Math.min(...requests) + this.config.windowMs : 
      now + this.config.windowMs;

    // Record this request if allowed
    if (allowed) {
      requests.push(now);
      this.requests.set(identifier, requests);
    }

    return {
      allowed,
      remaining,
      resetTime
    };
  }

  /**
   * Record request result
   */
  recordRequest(_identifier: string, success: boolean): void {
    if (this.config.skipSuccessfulRequests && success) return;
    if (this.config.skipFailedRequests && !success) return;

    // Request was already recorded in isAllowed if it was permitted
  }

  /**
   * Get current status for identifier
   */
  getStatus(identifier: string): { requests: number; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    let requests = this.requests.get(identifier) || [];
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    const remaining = Math.max(0, this.config.maxRequests - requests.length);
    const resetTime = requests.length > 0 ? 
      Math.min(...requests) + this.config.windowMs : 
      now + this.config.windowMs;

    return {
      requests: requests.length,
      remaining,
      resetTime
    };
  }

  /**
   * Clear requests for identifier
   */
  clear(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }

  /**
   * Cleanup old requests
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [identifier, requests] of this.requests.entries()) {
      const filtered = requests.filter(timestamp => timestamp > windowStart);
      
      if (filtered.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, filtered);
      }
    }
  }
}

/**
 * API Version Manager
 */
export class APIVersionManager {
  private versions: Map<string, VersionConfig> = new Map();
  private currentVersion: string;

  constructor(currentVersion: string = '1.0') {
    this.currentVersion = currentVersion;
    this.registerVersion(currentVersion, { version: currentVersion });
  }

  /**
   * Register API version
   */
  registerVersion(version: string, config: VersionConfig): void {
    this.versions.set(version, config);
  }

  /**
   * Get version configuration
   */
  getVersion(version: string): VersionConfig | null {
    return this.versions.get(version) || null;
  }

  /**
   * Check if version is supported
   */
  isVersionSupported(version: string): boolean {
    const config = this.versions.get(version);
    
    if (!config) return false;
    if (config.deprecated && config.supportedUntil && new Date() > config.supportedUntil) {
      return false;
    }
    
    return true;
  }

  /**
   * Get current version
   */
  getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Set current version
   */
  setCurrentVersion(version: string): void {
    if (!this.versions.has(version)) {
      throw new Error(`Version ${version} is not registered`);
    }
    this.currentVersion = version;
  }

  /**
   * Get all versions
   */
  getAllVersions(): VersionConfig[] {
    return Array.from(this.versions.values());
  }

  /**
   * Get deprecated versions
   */
  getDeprecatedVersions(): VersionConfig[] {
    return Array.from(this.versions.values()).filter(config => config.deprecated);
  }

  /**
   * Parse version from request headers
   */
  parseVersionFromHeaders(headers: Record<string, string>): string {
    // Check various version header formats
    const versionHeader = headers['api-version'] || 
                         headers['x-api-version'] || 
                         headers['version'];
    
    if (versionHeader) {
      return versionHeader;
    }

    // Check Accept header for version
    const acceptHeader = headers['accept'];
    if (acceptHeader) {
      const match = acceptHeader.match(/application\/vnd\.api\.v(\d+(?:\.\d+)?)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return this.currentVersion;
  }

  /**
   * Create version-specific response headers
   */
  createVersionHeaders(version: string): Record<string, string> {
    const config = this.versions.get(version);
    const headers: Record<string, string> = {
      'API-Version': version,
      'X-API-Version': version
    };

    if (config?.deprecated) {
      headers['Warning'] = '299 - "This API version is deprecated"';
      
      if (config.supportedUntil) {
        headers['Sunset'] = config.supportedUntil.toISOString();
      }
      
      if (config.migrationGuide) {
        headers['Link'] = `<${config.migrationGuide}>; rel="migration-guide"`;
      }
    }

    return headers;
  }
}

/**
 * Request Throttler
 */
export class RequestThrottler {
  private queues: Map<string, Array<{
    request: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    priority: number;
  }>> = new Map();
  
  private processing: Set<string> = new Set();
  private config: Map<string, { maxConcurrent: number; delay: number }> = new Map();

  /**
   * Configure throttling for endpoint pattern
   */
  configure(pattern: string, maxConcurrent: number, delay: number = 0): void {
    this.config.set(pattern, { maxConcurrent, delay });
  }

  /**
   * Throttle request
   */
  async throttle<T>(
    endpoint: string,
    requestFn: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const pattern = this.findMatchingPattern(endpoint);
      const queueKey = pattern || 'default';
      
      if (!this.queues.has(queueKey)) {
        this.queues.set(queueKey, []);
      }

      const queue = this.queues.get(queueKey)!;
      queue.push({
        request: requestFn,
        resolve,
        reject,
        priority
      });

      // Sort by priority (higher number = higher priority)
      queue.sort((a, b) => b.priority - a.priority);

      this.processQueue(queueKey);
    });
  }

  /**
   * Process request queue
   */
  private async processQueue(queueKey: string): Promise<void> {
    if (this.processing.has(queueKey)) {
      return; // Already processing this queue
    }

    const queue = this.queues.get(queueKey);
    const config = this.config.get(queueKey) || { maxConcurrent: 1, delay: 0 };
    
    if (!queue || queue.length === 0) {
      return;
    }

    this.processing.add(queueKey);
    const activePromises: Promise<void>[] = [];

    while (queue.length > 0 && activePromises.length < config.maxConcurrent) {
      const item = queue.shift()!;
      
      const promise = this.executeRequest(item, config.delay)
        .finally(() => {
          // Remove from active promises when done
          const index = activePromises.indexOf(promise);
          if (index > -1) {
            activePromises.splice(index, 1);
          }
        });

      activePromises.push(promise);
    }

    // Wait for all active requests to complete
    await Promise.all(activePromises);

    this.processing.delete(queueKey);

    // Continue processing if there are more items
    if (queue.length > 0) {
      await this.processQueue(queueKey);
    }
  }

  /**
   * Execute individual request
   */
  private async executeRequest(
    item: {
      request: () => Promise<any>;
      resolve: (value: any) => void;
      reject: (error: any) => void;
    },
    delay: number
  ): Promise<void> {
    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const result = await item.request();
      item.resolve(result);
    } catch (error) {
      item.reject(error);
    }
  }

  /**
   * Find matching pattern for endpoint
   */
  private findMatchingPattern(endpoint: string): string | null {
    for (const pattern of this.config.keys()) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      if (regex.test(endpoint)) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Get queue statistics
   */
  getStats(): Record<string, {
    queued: number;
    processing: boolean;
    config: { maxConcurrent: number; delay: number };
  }> {
    const stats: Record<string, any> = {};

    for (const [pattern, config] of this.config.entries()) {
      const queue = this.queues.get(pattern) || [];
      stats[pattern] = {
        queued: queue.length,
        processing: this.processing.has(pattern),
        config
      };
    }

    return stats;
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.queues.clear();
    this.processing.clear();
  }
}

// Pre-configured instances
export const globalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000
});

export const apiVersionManager = new APIVersionManager('1.0');

export const requestThrottler = new RequestThrottler();

// Configure common throttling patterns
requestThrottler.configure('/api/news*', 5, 100);
requestThrottler.configure('/api/upload*', 2, 1000);
requestThrottler.configure('/api/auth*', 3, 500);