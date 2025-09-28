/**
 * API Optimization System
 * Entry point for all API optimization features
 */

// Core API Client
export { OptimizedAPIClient } from './client';

// News-specific API Client  
export { NewsAPIClient, useOptimizedAPI, legacyAPI, optimizedAPI } from './integration';

// Caching System
export { 
  APICache, 
  RequestQueue, 
  ResponseCompression, 
  APIPerformanceMonitor 
} from './cache';

// Management Systems
export { 
  RateLimiter, 
  APIVersionManager, 
  RequestThrottler 
} from './management';

// Middleware
export { APIMiddleware } from './middleware';

// Configuration
export { 
  getAPIConfig, 
  validateAPIConfig, 
  mergeAPIConfig,
  currentAPIConfig,
  defaultAPIConfig,
  productionAPIConfig,
  developmentAPIConfig
} from './config';
export type { APIConfig } from './config';

// Setup Utilities
export { setupAPIMiddleware } from './integration';