/**
 * Optimized API Client
 * High-performance API client with caching, retry logic, and monitoring
 */

import { apiCache, requestQueue, performanceMonitor } from './cache';

interface APIClientConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCache: boolean;
  enableCompression: boolean;
  enableMonitoring: boolean;
  defaultHeaders: Record<string, string>;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  cache?: boolean | number; // true/false or TTL in ms
  retry?: boolean;
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
}

interface APIResponse<T> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  requestId: string;
  timing: {
    total: number;
    network: number;
    processing: number;
  };
}

export class OptimizedAPIClient {
  private config: APIClientConfig;
  private requestIdCounter = 0;

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = {
      baseURL: process.env.NEXT_PUBLIC_API_PATH || 'http://localhost:5000',
      timeout: 10000,
      retryAttempts: 3,
      retryDelay: 1000,
      enableCache: true,
      enableCompression: true,
      enableMonitoring: true,
      defaultHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      ...config
    };
  }

  /**
   * Make optimized API request
   */
  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<APIResponse<T>> {
    const requestId = this.generateRequestId();
    const startTime = Date.now();
    let networkTime = 0;
    let processingTime = 0;

    // Normalize endpoint
    const url = this.buildURL(endpoint);
    const cacheKey = this.generateCacheKey(url, options);
    
    // Check cache first
    if (this.shouldUseCache(options) && this.config.enableCache) {
      const cached = apiCache.get<T>(cacheKey);
      if (cached) {
        const totalTime = Date.now() - startTime;
        
        if (this.config.enableMonitoring) {
          performanceMonitor.recordCall(endpoint, totalTime, true);
        }

        return {
          data: cached,
          status: 200,
          headers: {},
          cached: true,
          requestId,
          timing: {
            total: totalTime,
            network: 0,
            processing: totalTime
          }
        };
      }
    }

    // Create request function
    const requestFn = async (): Promise<APIResponse<T>> => {
      const networkStart = Date.now();
      
      try {
        const response = await this.executeRequest<T>(url, options, requestId);
        networkTime = Date.now() - networkStart;
        
        // Cache successful responses
        if (response.status >= 200 && response.status < 300 && this.shouldUseCache(options)) {
          const ttl = typeof options.cache === 'number' ? options.cache : undefined;
          const metadata: { etag?: string; lastModified?: string } = {};
          if (response.headers['etag']) metadata.etag = response.headers['etag'];
          if (response.headers['last-modified']) metadata.lastModified = response.headers['last-modified'];
          
          apiCache.set(cacheKey, response.data, ttl, metadata);
        }

        processingTime = Date.now() - networkStart - networkTime;
        const totalTime = Date.now() - startTime;

        if (this.config.enableMonitoring) {
          performanceMonitor.recordCall(endpoint, totalTime, true);
        }

        return {
          ...response,
          cached: false,
          requestId,
          timing: {
            total: totalTime,
            network: networkTime,
            processing: processingTime
          }
        };

      } catch (error) {
        const totalTime = Date.now() - startTime;
        
        if (this.config.enableMonitoring) {
          performanceMonitor.recordCall(endpoint, totalTime, false);
        }
        
        throw error;
      }
    };

    // Use request queue for concurrent request management
    return requestQueue.enqueue(cacheKey, requestFn);
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'POST', body: data });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PUT', body: data });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options: Omit<RequestOptions, 'method' | 'body'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any, options: Omit<RequestOptions, 'method'> = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body: data });
  }

  /**
   * Batch requests
   */
  async batch<T>(requests: Array<{ endpoint: string; options?: RequestOptions }>): Promise<APIResponse<T>[]> {
    const promises = requests.map(({ endpoint, options }) => 
      this.request<T>(endpoint, options)
    );
    
    return Promise.all(promises);
  }

  /**
   * Invalidate cache
   */
  invalidateCache(pattern?: string | RegExp): void {
    if (pattern) {
      apiCache.invalidate(pattern);
    } else {
      apiCache.clear();
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(): any {
    return performanceMonitor.getAllMetrics();
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string, 
    options: RequestOptions,
    requestId: string
  ): Promise<{ data: T; status: number; headers: Record<string, string> }> {
    const { method = 'GET', headers = {}, body, retry = true, timeout } = options;
    
    const requestHeaders = {
      ...this.config.defaultHeaders,
      ...headers,
      'X-Request-ID': requestId
    };

    let lastError: Error;
    let attempt = 0;
    const maxAttempts = retry ? this.config.retryAttempts : 1;

    while (attempt < maxAttempts) {
      attempt++;

      try {
        const controller = new AbortController();
        const timeoutMs = timeout || this.config.timeout;
        
        // Set timeout
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const fetchOptions: RequestInit = {
          method,
          headers: requestHeaders,
          signal: controller.signal,
          ...(body && { body: JSON.stringify(body) })
        };

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Handle non-2xx responses
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const responseText = await response.text();
        let data: T;
        
        try {
          data = responseText ? JSON.parse(responseText) : null;
        } catch {
          // If not JSON, return as string
          data = responseText as unknown as T;
        }

        // Extract headers
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        return {
          data,
          status: response.status,
          headers: responseHeaders
        };

      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (
          error instanceof TypeError ||
          (error as any).name === 'AbortError' ||
          attempt >= maxAttempts
        ) {
          break;
        }

        // Wait before retry
        if (attempt < maxAttempts) {
          await this.sleep(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError!;
  }

  /**
   * Build full URL
   */
  private buildURL(endpoint: string): string {
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    
    const base = this.config.baseURL.replace(/\/$/, '');
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
    return `${base}${path}`;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(url: string, options: RequestOptions): string {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    const headers = JSON.stringify(options.headers || {});
    
    return `${method}:${url}:${body}:${headers}`;
  }

  /**
   * Check if request should use cache
   */
  private shouldUseCache(options: RequestOptions): boolean {
    if (options.cache === false) return false;
    if (options.method && options.method !== 'GET') return false;
    return this.config.enableCache;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${++this.requestIdCounter}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Pre-configured API clients for different services
 */
export const newsAPI = new OptimizedAPIClient({
  baseURL: process.env.NEXT_PUBLIC_API_PATH || 'http://localhost:5000',
  timeout: 15000,
  enableCache: true,
  retryAttempts: 3
});

export const uploadAPI = new OptimizedAPIClient({
  baseURL: process.env.UPLOAD_FILE_PATH || 'http://localhost:5001',
  timeout: 30000,
  enableCache: false, // Don't cache uploads
  retryAttempts: 2
});

export const publicAPI = new OptimizedAPIClient({
  baseURL: '/api',
  timeout: 5000,
  enableCache: true,
  retryAttempts: 1
});

export default OptimizedAPIClient;