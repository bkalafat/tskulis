/**
 * Security Middleware for TS Kulis
 * Comprehensive security measures including XSS protection, CSRF tokens, and secure headers
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import DOMPurify from 'isomorphic-dompurify';
import rateLimit from 'express-rate-limit';

// Content Security Policy configuration
export const CSP_HEADER = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 
    https://www.google-analytics.com 
    https://www.googletagmanager.com
    https://connect.facebook.net
    https://platform.twitter.com;
  style-src 'self' 'unsafe-inline' 
    https://fonts.googleapis.com
    https://cdn.jsdelivr.net;
  font-src 'self' 
    https://fonts.gstatic.com
    https://cdn.jsdelivr.net;
  img-src 'self' data: blob:
    https://*.firebase.com
    https://*.googleusercontent.com
    https://www.google-analytics.com
    https://stats.g.doubleclick.net;
  connect-src 'self'
    https://api.tskulis.com
    https://*.firebase.com
    https://www.google-analytics.com
    https://stats.g.doubleclick.net;
  frame-src 'self'
    https://www.youtube.com
    https://platform.twitter.com;
  media-src 'self' blob:
    https://*.firebase.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s+/g, ' ').trim();

// Security headers configuration
export const SECURITY_HEADERS = {
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Content Type Options
  'X-Content-Type-Options': 'nosniff',
  
  // Frame Options
  'X-Frame-Options': 'DENY',
  
  // Content Security Policy
  'Content-Security-Policy': CSP_HEADER,
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // HTTP Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  
  // Remove server information
  'X-Powered-By': '',
  'Server': ''
};

/**
 * Input Sanitization Utility
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  static sanitizeHtml(dirty: string): string {
    if (!dirty || typeof dirty !== 'string') {
      return '';
    }

    const config = {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'a', 'img', 'blockquote', 'code', 'pre'
      ],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel'],
      ALLOW_DATA_ATTR: false,
      FORBID_SCRIPT: true,
      FORBID_TAGS: ['script', 'object', 'embed', 'iframe', 'form', 'input'],
      KEEP_CONTENT: true,
      FORCE_BODY: false
    };

    return DOMPurify.sanitize(dirty, config);
  }

  /**
   * Sanitize user input for database storage
   */
  static sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return input
        .trim()
        .replace(/[<>]/g, '') // Remove basic HTML brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/data:/gi, '') // Remove data: protocol
        .replace(/vbscript:/gi, '') // Remove vbscript: protocol
        .substring(0, 10000); // Limit length
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeInput(item));
    }

    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(input)) {
        const cleanKey = this.sanitizeInput(key);
        sanitized[cleanKey] = this.sanitizeInput(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Validate and sanitize news content
   */
  static sanitizeNewsContent(content: string): string {
    if (!content) return '';

    // First pass: Basic sanitization
    let sanitized = this.sanitizeHtml(content);

    // Second pass: News-specific cleaning
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove any remaining scripts
      .replace(/on\w+\s*=\s*"[^"]*"/gi, '') // Remove event handlers
      .replace(/on\w+\s*=\s*'[^']*'/gi, '') // Remove event handlers with single quotes
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .trim();

    // Validate structure
    if (sanitized.length > 50000) {
      throw new Error('Content too long');
    }

    return sanitized;
  }

  /**
   * Sanitize file upload metadata
   */
  static sanitizeFileMetadata(metadata: any): any {
    return {
      filename: this.sanitizeInput(metadata.filename)?.replace(/[^a-zA-Z0-9._-]/g, ''),
      mimetype: this.sanitizeInput(metadata.mimetype)?.toLowerCase(),
      size: typeof metadata.size === 'number' ? metadata.size : 0
    };
  }
}

/**
 * CSRF Token Management
 */
export class CSRFProtection {
  private static readonly SECRET = process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production';
  private static readonly HEADER_NAME = 'X-CSRF-Token';
  private static readonly COOKIE_NAME = 'csrf-token';

  /**
   * Generate CSRF token
   */
  static generateToken(sessionId: string): string {
    const timestamp = Date.now().toString();
    const payload = `${sessionId}:${timestamp}`;
    
    // Simple token generation (in production, use crypto.createHmac)
    const token = Buffer.from(`${payload}:${this.SECRET}`).toString('base64');
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [receivedSessionId, timestamp, secret] = decoded.split(':');
      
      // Validate session ID
      if (receivedSessionId !== sessionId) {
        return false;
      }

      // Validate secret
      if (secret !== this.SECRET) {
        return false;
      }

      // Validate timestamp (token expires in 1 hour)
      const tokenTime = parseInt(timestamp || '0');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      return (now - tokenTime) < oneHour;
    } catch (error) {
      return false;
    }
  }

  /**
   * Middleware to check CSRF token
   */
  static middleware(req: NextRequest): boolean {
    // Skip CSRF for GET requests and API health checks
    if (req.method === 'GET' || req.nextUrl.pathname.includes('/api/health')) {
      return true;
    }

    const token = req.headers.get(this.HEADER_NAME);
    const sessionCookie = req.cookies.get('session-id');
    const sessionId = (typeof sessionCookie === 'string' ? sessionCookie : sessionCookie?.value) || 'anonymous';

    if (!token) {
      return false;
    }

    return this.validateToken(token, sessionId);
  }
}

/**
 * Rate Limiting Configuration
 */
export const rateLimitConfig = {
  // General API rate limiting
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: {
      error: 'Too many requests, please try again later.',
      resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
      error: 'Too many authentication attempts, please try again later.',
      resetTime: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }
  }),

  // File upload endpoints
  upload: rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 uploads per hour
    message: {
      error: 'Upload limit exceeded, please try again later.',
      resetTime: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    }
  }),

  // Comment endpoints
  comments: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 comments per minute
    message: {
      error: 'Comment rate limit exceeded, please wait before commenting again.',
      resetTime: new Date(Date.now() + 60 * 1000).toISOString()
    }
  })
};

/**
 * Security Validation Rules
 */
export const SecurityRules = {
  // News content validation
  news: {
    caption: {
      maxLength: 200,
      required: true,
      pattern: /^[a-zA-Z0-9\s\u00C0-\u017F.,!?()-]+$/
    },
    content: {
      maxLength: 50000,
      required: true,
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'a', 'img']
    },
    category: {
      allowedValues: ['trabzonspor', 'transfer', 'general', 'football'],
      required: true
    }
  },

  // Comment validation
  comment: {
    content: {
      maxLength: 1000,
      minLength: 3,
      required: true,
      pattern: /^[a-zA-Z0-9\s\u00C0-\u017F.,!?()-]+$/
    },
    author: {
      maxLength: 50,
      required: true,
      pattern: /^[a-zA-Z\s\u00C0-\u017F]+$/
    }
  },

  // File upload validation
  file: {
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp']
  }
};

/**
 * Input Validator
 */
export class InputValidator {
  static validateNews(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const rules = SecurityRules.news;

    // Validate caption
    if (!data.caption || data.caption.length > rules.caption.maxLength) {
      errors.push('Invalid caption length');
    }
    if (!rules.caption.pattern.test(data.caption)) {
      errors.push('Caption contains invalid characters');
    }

    // Validate content
    if (!data.content || data.content.length > rules.content.maxLength) {
      errors.push('Invalid content length');
    }

    // Validate category
    if (!rules.category.allowedValues.includes(data.category)) {
      errors.push('Invalid category');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateComment(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const rules = SecurityRules.comment;

    // Validate content
    if (!data.content || 
        data.content.length < rules.content.minLength || 
        data.content.length > rules.content.maxLength) {
      errors.push('Invalid comment length');
    }
    if (!rules.content.pattern.test(data.content)) {
      errors.push('Comment contains invalid characters');
    }

    // Validate author
    if (!data.author || data.author.length > rules.author.maxLength) {
      errors.push('Invalid author name');
    }
    if (!rules.author.pattern.test(data.author)) {
      errors.push('Author name contains invalid characters');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateFile(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const rules = SecurityRules.file;

    // Validate file type
    if (!rules.allowedTypes.includes(file.mimetype)) {
      errors.push('Invalid file type');
    }

    // Validate file size
    if (file.size > rules.maxSize) {
      errors.push('File too large');
    }

    // Validate file extension
    const extension = file.originalname?.toLowerCase().match(/\.[^.]+$/)?.[0];
    if (!extension || !rules.allowedExtensions.includes(extension)) {
      errors.push('Invalid file extension');
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Security Middleware Function
 */
export function securityMiddleware(req: NextRequest) {
  const response = NextResponse.next();

  // Apply security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Check CSRF for non-GET requests
  if (req.method !== 'GET' && !CSRFProtection.middleware(req)) {
    return new NextResponse('CSRF token invalid', { status: 403 });
  }

  return response;
}

export default {
  InputSanitizer,
  CSRFProtection,
  SecurityRules,
  InputValidator,
  securityMiddleware,
  SECURITY_HEADERS,
  CSP_HEADER
};