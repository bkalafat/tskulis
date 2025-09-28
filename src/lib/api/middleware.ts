/**
 * API Middleware System
 * Comprehensive middleware for API optimization, monitoring, and management
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { globalRateLimiter, apiVersionManager, requestThrottler } from './management';
import { performanceMonitor } from './cache';

interface MiddlewareContext {
  startTime: number;
  requestId: string;
  version: string;
  userAgent?: string;
  clientIP: string;
}

type MiddlewareHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;

/**
 * API Middleware Pipeline
 */
export class APIMiddleware {
  private middlewares: MiddlewareHandler[] = [];
  private enabledFeatures: Set<string> = new Set();

  constructor() {
    // Register default middlewares
    this.use(requestLoggingMiddleware);
    this.use(corsMiddleware);
    this.use(compressionMiddleware);
  }

  /**
   * Add middleware to pipeline
   */
  use(middleware: MiddlewareHandler): this {
    this.middlewares.push(middleware);
    return this;
  }

  /**
   * Enable feature middleware
   */
  enableFeature(feature: string): this {
    this.enabledFeatures.add(feature);
    
    switch (feature) {
      case 'rateLimit':
        this.use(rateLimitMiddleware);
        break;
      case 'versioning':
        this.use(versioningMiddleware);
        break;
      case 'throttling':
        this.use(throttlingMiddleware);
        break;
      case 'monitoring':
        this.use(monitoringMiddleware);
        break;
      case 'cache':
        this.use(cacheMiddleware);
        break;
      case 'validation':
        this.use(validationMiddleware);
        break;
    }
    
    return this;
  }

  /**
   * Process request through middleware pipeline
   */
  async process(
    req: NextApiRequest,
    res: NextApiResponse,
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ): Promise<void> {
    const context: MiddlewareContext = {
      startTime: Date.now(),
      requestId: this.generateRequestId(),
      version: apiVersionManager.parseVersionFromHeaders(req.headers as Record<string, string>),
      clientIP: this.getClientIP(req),
      ...(req.headers['user-agent'] && { userAgent: req.headers['user-agent'] })
    };

    // Add request ID to response headers
    res.setHeader('X-Request-ID', context.requestId);

    let currentIndex = 0;

    const next = async (): Promise<void> => {
      if (currentIndex < this.middlewares.length) {
        const middleware = this.middlewares[currentIndex++];
        if (middleware) {
          await middleware(req, res, context, next);
        }
      } else {
        // Execute the actual handler
        await handler(req, res);
      }
    };

    try {
      await next();
    } catch (error) {
      await this.handleError(error, req, res, context);
    }
  }

  /**
   * Handle middleware errors
   */
  private async handleError(
    error: any,
    req: NextApiRequest,
    res: NextApiResponse,
    context: MiddlewareContext
  ): Promise<void> {
    console.error(`API Error [${context.requestId}]:`, error);

    // Record error in monitoring
    if (this.enabledFeatures.has('monitoring')) {
      performanceMonitor.recordCall(
        req.url || 'unknown',
        Date.now() - context.startTime,
        false
      );
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        requestId: context.requestId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get client IP address
   */
  private getClientIP(req: NextApiRequest): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    return forwarded ? forwarded.split(',')[0]?.trim() || '127.0.0.1' : 
           req.headers['x-real-ip'] as string ||
           req.connection?.remoteAddress ||
           '127.0.0.1';
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Request Logging Middleware
 */
const requestLoggingMiddleware: MiddlewareHandler = async (req, res, context, next) => {
  console.log(`[${context.requestId}] ${req.method} ${req.url} - ${context.clientIP}`);
  
  await next();
  
  const duration = Date.now() - context.startTime;
  const statusCode = res.statusCode;
  
  console.log(`[${context.requestId}] ${statusCode} - ${duration}ms`);
};

/**
 * CORS Middleware
 */
const corsMiddleware: MiddlewareHandler = async (req, res, _context, next) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key, X-Request-ID');
  res.setHeader('Access-Control-Expose-Headers', 'X-Request-ID, X-Rate-Limit-*');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await next();
};

/**
 * Compression Middleware
 */
const compressionMiddleware: MiddlewareHandler = async (req, res, _context, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
  }
  
  await next();
};

/**
 * Rate Limiting Middleware
 */
const rateLimitMiddleware: MiddlewareHandler = async (_req, res, context, next) => {
  const identifier = context.clientIP;
  const result = globalRateLimiter.isAllowed(identifier);
  
  // Set rate limit headers
  res.setHeader('X-Rate-Limit-Limit', '1000');
  res.setHeader('X-Rate-Limit-Remaining', result.remaining.toString());
  res.setHeader('X-Rate-Limit-Reset', new Date(result.resetTime).toISOString());
  
  if (!result.allowed) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again later.',
      resetTime: result.resetTime
    });
    return;
  }
  
  await next();
};

/**
 * API Versioning Middleware
 */
const versioningMiddleware: MiddlewareHandler = async (_req, res, context, next) => {
  const version = context.version;
  
  if (!apiVersionManager.isVersionSupported(version)) {
    res.status(400).json({
      error: 'Unsupported API version',
      version,
      supportedVersions: apiVersionManager.getAllVersions().map(v => v.version)
    });
    return;
  }
  
  // Add version headers
  const versionHeaders = apiVersionManager.createVersionHeaders(version);
  Object.entries(versionHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
  
  await next();
};

/**
 * Request Throttling Middleware
 */
const throttlingMiddleware: MiddlewareHandler = async (req, _res, _context, next) => {
  const endpoint = req.url || '';
  
  await requestThrottler.throttle(endpoint, async () => {
    await next();
  });
};

/**
 * Performance Monitoring Middleware
 */
const monitoringMiddleware: MiddlewareHandler = async (req, res, context, next) => {
  const startTime = context.startTime;
  const endpoint = req.url || '';
  
  try {
    await next();
    
    const duration = Date.now() - startTime;
    performanceMonitor.recordCall(endpoint, duration, true);
    
    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    performanceMonitor.recordCall(endpoint, duration, false);
    throw error;
  }
};

/**
 * Cache Headers Middleware
 */
const cacheMiddleware: MiddlewareHandler = async (req, res, context, next) => {
  // Set cache headers based on request type
  if (req.method === 'GET') {
    const url = req.url || '';
    
    if (url.includes('/news')) {
      // Cache news for 5 minutes
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
    } else if (url.includes('/static')) {
      // Cache static resources for 1 hour
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    } else {
      // Default cache policy
      res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    }
    
    // Add ETag support
    res.setHeader('ETag', `W/"${context.requestId}"`);
  } else {
    // No cache for non-GET requests
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  
  await next();
};

/**
 * Request Validation Middleware
 */
const validationMiddleware: MiddlewareHandler = async (req, res, _context, next) => {
  // Validate Content-Type for POST/PUT/PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('application/json')) {
      res.status(400).json({
        error: 'Invalid Content-Type',
        expected: 'application/json',
        received: contentType
      });
      return;
    }
  }
  
  // Validate request size
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB limit
    res.status(413).json({
      error: 'Request too large',
      maxSize: '10MB'
    });
    return;
  }
  
  await next();
};

/**
 * Create API middleware with common features
 */
export function createAPIMiddleware(): APIMiddleware {
  return new APIMiddleware()
    .enableFeature('rateLimit')
    .enableFeature('versioning')
    .enableFeature('monitoring')
    .enableFeature('cache')
    .enableFeature('validation');
}

/**
 * Higher-order function to wrap API handlers with middleware
 */
export function withAPIMiddleware(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  customMiddleware?: APIMiddleware
): (req: NextApiRequest, res: NextApiResponse) => Promise<void> {
  const middleware = customMiddleware || createAPIMiddleware();
  
  return async (req: NextApiRequest, res: NextApiResponse) => {
    await middleware.process(req, res, handler);
  };
}

export default APIMiddleware;