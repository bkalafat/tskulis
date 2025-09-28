/**
 * API Configuration
 * Central configuration for API optimization features
 */

export interface APIConfig {
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
    compression: boolean;
    persistToStorage: boolean;
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
  };
  versioning: {
    enabled: boolean;
    currentVersion: string;
    supportedVersions: string[];
    deprecationWarnings: boolean;
  };
  throttling: {
    enabled: boolean;
    maxConcurrent: number;
    delay: number;
    patterns: Record<string, { maxConcurrent: number; delay: number }>;
  };
  monitoring: {
    enabled: boolean;
    enablePerformanceTracking: boolean;
    enableErrorTracking: boolean;
    metricsRetention: number;
  };
  optimization: {
    enableCompression: boolean;
    enableCaching: boolean;
    enableBatching: boolean;
    batchSize: number;
    timeoutMs: number;
    retryAttempts: number;
    retryDelay: number;
  };
  security: {
    enableCORS: boolean;
    corsOrigins: string[];
    enableCSRF: boolean;
    maxRequestSize: number;
    requireContentType: boolean;
  };
}

/**
 * Default API Configuration
 */
export const defaultAPIConfig: APIConfig = {
  cache: {
    enabled: true,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    maxSize: 1000,
    compression: true,
    persistToStorage: false
  },
  rateLimit: {
    enabled: true,
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 1000,
    skipSuccessfulRequests: false,
    skipFailedRequests: false
  },
  versioning: {
    enabled: true,
    currentVersion: '1.0',
    supportedVersions: ['1.0'],
    deprecationWarnings: true
  },
  throttling: {
    enabled: true,
    maxConcurrent: 6,
    delay: 0,
    patterns: {
      '/api/news*': { maxConcurrent: 5, delay: 100 },
      '/api/upload*': { maxConcurrent: 2, delay: 1000 },
      '/api/auth*': { maxConcurrent: 3, delay: 500 }
    }
  },
  monitoring: {
    enabled: true,
    enablePerformanceTracking: true,
    enableErrorTracking: true,
    metricsRetention: 24 * 60 * 60 * 1000 // 24 hours
  },
  optimization: {
    enableCompression: true,
    enableCaching: true,
    enableBatching: false,
    batchSize: 10,
    timeoutMs: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  security: {
    enableCORS: true,
    corsOrigins: ['*'],
    enableCSRF: false, // Disabled for API endpoints
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    requireContentType: true
  }
};

/**
 * Production API Configuration
 */
export const productionAPIConfig: APIConfig = {
  ...defaultAPIConfig,
  cache: {
    ...defaultAPIConfig.cache,
    defaultTTL: 10 * 60 * 1000, // 10 minutes
    maxSize: 5000,
    persistToStorage: true
  },
  rateLimit: {
    ...defaultAPIConfig.rateLimit,
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: 500
  },
  throttling: {
    ...defaultAPIConfig.throttling,
    maxConcurrent: 10,
    patterns: {
      '/api/news*': { maxConcurrent: 8, delay: 50 },
      '/api/upload*': { maxConcurrent: 3, delay: 500 },
      '/api/auth*': { maxConcurrent: 5, delay: 200 }
    }
  },
  security: {
    ...defaultAPIConfig.security,
    corsOrigins: [
      'https://tskulis.com',
      'https://www.tskulis.com',
      'https://admin.tskulis.com'
    ],
    enableCSRF: true
  }
};

/**
 * Development API Configuration
 */
export const developmentAPIConfig: APIConfig = {
  ...defaultAPIConfig,
  cache: {
    ...defaultAPIConfig.cache,
    defaultTTL: 30 * 1000, // 30 seconds
    persistToStorage: false
  },
  rateLimit: {
    ...defaultAPIConfig.rateLimit,
    maxRequests: 10000 // Very high limit for development
  },
  monitoring: {
    ...defaultAPIConfig.monitoring,
    enablePerformanceTracking: false // Disable in development
  }
};

/**
 * Environment-specific configuration loader
 */
export function getAPIConfig(): APIConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return productionAPIConfig;
    case 'development':
      return developmentAPIConfig;
    case 'test':
      return {
        ...defaultAPIConfig,
        cache: { ...defaultAPIConfig.cache, enabled: false },
        rateLimit: { ...defaultAPIConfig.rateLimit, enabled: false },
        monitoring: { ...defaultAPIConfig.monitoring, enabled: false }
      };
    default:
      return defaultAPIConfig;
  }
}

/**
 * Configuration validator
 */
export function validateAPIConfig(config: Partial<APIConfig>): string[] {
  const errors: string[] = [];

  // Validate cache configuration
  if (config.cache) {
    if (config.cache.defaultTTL && config.cache.defaultTTL < 1000) {
      errors.push('Cache TTL should be at least 1 second (1000ms)');
    }
    if (config.cache.maxSize && config.cache.maxSize < 10) {
      errors.push('Cache max size should be at least 10');
    }
  }

  // Validate rate limit configuration
  if (config.rateLimit) {
    if (config.rateLimit.windowMs && config.rateLimit.windowMs < 1000) {
      errors.push('Rate limit window should be at least 1 second (1000ms)');
    }
    if (config.rateLimit.maxRequests && config.rateLimit.maxRequests < 1) {
      errors.push('Rate limit max requests should be at least 1');
    }
  }

  // Validate versioning configuration
  if (config.versioning) {
    if (config.versioning.supportedVersions && config.versioning.supportedVersions.length === 0) {
      errors.push('At least one supported version must be specified');
    }
  }

  // Validate throttling configuration
  if (config.throttling) {
    if (config.throttling.maxConcurrent && config.throttling.maxConcurrent < 1) {
      errors.push('Throttling max concurrent should be at least 1');
    }
  }

  // Validate optimization configuration
  if (config.optimization) {
    if (config.optimization.timeoutMs && config.optimization.timeoutMs < 1000) {
      errors.push('Timeout should be at least 1 second (1000ms)');
    }
    if (config.optimization.retryAttempts && config.optimization.retryAttempts < 0) {
      errors.push('Retry attempts should be 0 or greater');
    }
  }

  return errors;
}

/**
 * Configuration merger with validation
 */
export function mergeAPIConfig(base: APIConfig, override: Partial<APIConfig>): APIConfig {
  const merged = {
    ...base,
    ...override,
    cache: { ...base.cache, ...override.cache },
    rateLimit: { ...base.rateLimit, ...override.rateLimit },
    versioning: { ...base.versioning, ...override.versioning },
    throttling: { ...base.throttling, ...override.throttling },
    monitoring: { ...base.monitoring, ...override.monitoring },
    optimization: { ...base.optimization, ...override.optimization },
    security: { ...base.security, ...override.security }
  };

  const errors = validateAPIConfig(merged);
  if (errors.length > 0) {
    throw new Error(`Invalid API configuration: ${errors.join(', ')}`);
  }

  return merged;
}

/**
 * Export current configuration
 */
export const currentAPIConfig = getAPIConfig();
export default currentAPIConfig;