/**
 * Security Configuration
 * Central configuration for all security settings
 */

export const SecurityConfig = {
  // CSRF Protection
  csrf: {
    enabled: true,
    tokenExpiry: 60 * 60 * 1000, // 1 hour
    headerName: 'X-CSRF-Token',
    cookieName: 'csrf-token',
    skipRoutes: ['/api/health', '/api/auth', '/api/status']
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    windows: {
      general: { windowMs: 15 * 60 * 1000, maxRequests: 100 }, // 100 requests per 15 minutes
      auth: { windowMs: 15 * 60 * 1000, maxRequests: 5 },     // 5 auth attempts per 15 minutes
      upload: { windowMs: 60 * 60 * 1000, maxRequests: 10 },  // 10 uploads per hour
      comments: { windowMs: 60 * 1000, maxRequests: 3 },      // 3 comments per minute
      api: { windowMs: 60 * 1000, maxRequests: 30 }           // 30 API calls per minute
    }
  },

  // Content Security Policy
  csp: {
    enabled: true,
    directives: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "'unsafe-eval'",   // Required for React development
        'https://www.google-analytics.com',
        'https://www.googletagmanager.com',
        'https://connect.facebook.net',
        'https://platform.twitter.com'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com',
        'https://cdn.jsdelivr.net'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'https://cdn.jsdelivr.net'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://*.firebase.com',
        'https://*.googleusercontent.com',
        'https://www.google-analytics.com'
      ],
      'connect-src': [
        "'self'",
        'https://api.tskulis.com',
        'https://*.firebase.com',
        'https://www.google-analytics.com'
      ],
      'frame-src': [
        "'self'",
        'https://www.youtube.com',
        'https://platform.twitter.com'
      ],
      'media-src': [
        "'self'",
        'blob:',
        'https://*.firebase.com'
      ],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    }
  },

  // Input Validation
  validation: {
    enabled: true,
    maxLengths: {
      newsCaption: 200,
      newsContent: 50000,
      commentContent: 1000,
      commentAuthor: 50,
      fileName: 100
    },
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
    allowedFileExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedCategories: ['trabzonspor', 'transfer', 'general', 'football'],
    allowedTypes: ['news', 'headline', 'subNews'],
    allowedHtmlTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'a', 'img'],
    dangerousExtensions: ['.php', '.exe', '.bat', '.cmd', '.scr', '.js', '.html', '.asp', '.jsp']
  },

  // XSS Protection
  xss: {
    enabled: true,
    filterLevel: 'strict', // 'strict' | 'moderate' | 'basic'
    allowedProtocols: ['http:', 'https:', 'mailto:'],
    blockedProtocols: ['javascript:', 'data:', 'vbscript:', 'file:'],
    scanPatterns: [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
      /vbscript:/gi,
      /<iframe[^>]*src\s*=\s*["']?javascript:/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi
    ]
  },

  // Security Headers
  headers: {
    enabled: true,
    'X-XSS-Protection': '1; mode=block',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Cross-Origin-Embedder-Policy': 'credentialless',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    // HSTS only in production over HTTPS
    ...(process.env.NODE_ENV === 'production' && {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
    })
  },

  // Authentication Security
  auth: {
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    requireHttps: process.env.NODE_ENV === 'production',
    secureCookies: process.env.NODE_ENV === 'production',
    sameSiteCookies: 'strict'
  },

  // Audit Logging
  audit: {
    enabled: true,
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    maxLogSize: 1000, // Maximum number of log entries to keep in memory
    logRotation: 24 * 60 * 60 * 1000, // 24 hours
    sensitiveFields: ['password', 'token', 'secret', 'key'],
    logEvents: [
      'CSRF_VIOLATION',
      'RATE_LIMIT_EXCEEDED',
      'INVALID_INPUT',
      'FILE_UPLOAD_REJECTED',
      'XSS_ATTEMPT',
      'AUTH_FAILURE',
      'SECURITY_HEADER_VIOLATION'
    ]
  },

  // Environment-specific settings
  development: {
    disableCSP: false, // Set to true if CSP blocks development tools
    verboseLogging: true,
    skipRateLimit: false,
    allowInsecureCookies: true
  },

  production: {
    strictMode: true,
    enforceHttps: true,
    minimumLogLevel: 'warn',
    enableHSTS: true,
    reportingEndpoint: process.env.SECURITY_REPORTING_ENDPOINT
  }
};

// Environment-specific overrides
export const getSecurityConfig = () => {
  const baseConfig = { ...SecurityConfig };
  
  if (process.env.NODE_ENV === 'development') {
    return {
      ...baseConfig,
      ...baseConfig.development
    };
  }
  
  if (process.env.NODE_ENV === 'production') {
    return {
      ...baseConfig,
      ...baseConfig.production
    };
  }
  
  return baseConfig;
};

// Helper functions
export const isRouteExcluded = (path: string, excludedRoutes: string[]): boolean => {
  return excludedRoutes.some(route => path.startsWith(route));
};

export const generateCSPString = (directives: Record<string, string[]>): string => {
  return Object.entries(directives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

export const isFileTypeAllowed = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype.toLowerCase());
};

export const hasLimitExceeded = (current: number, limit: number): boolean => {
  return current >= limit;
};

export default SecurityConfig;