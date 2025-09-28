/**
 * Security Utilities
 * Helper functions for security operations
 */

import crypto from 'crypto';

/**
 * Simple Input Sanitizer (without external dependencies)
 */
export class SimpleSanitizer {
  /**
   * Remove HTML tags and dangerous characters
   */
  static sanitizeHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove script tags
      .replace(/<[^>]*>/g, '') // Remove all HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/data:/gi, '') // Remove data: protocol
      .replace(/vbscript:/gi, '') // Remove vbscript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 10000); // Limit length
  }

  /**
   * Sanitize user input for safe usage
   */
  static sanitizeInput(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove basic HTML brackets
      .replace(/['"]/g, '') // Remove quotes
      .replace(/;/g, '') // Remove semicolons
      .replace(/--/g, '') // Remove SQL comment syntax
      .substring(0, 1000); // Limit length
  }

  /**
   * Sanitize news content specifically
   */
  static sanitizeNewsContent(content: string): string {
    if (!content) return '';

    // Allow basic formatting but remove dangerous elements
    const allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3'];
    let sanitized = content;

    // Remove script tags and event handlers
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '');

    // Remove disallowed HTML tags
    const tagRegex = /<(\/?)([\w]+)[^>]*>/g;
    sanitized = sanitized.replace(tagRegex, (match, _closing, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return match;
      }
      return '';
    });

    return sanitized.trim().substring(0, 50000);
  }
}

/**
 * CSRF Token Generator
 */
export class CSRFTokenGenerator {
  private static readonly SECRET = process.env.CSRF_SECRET || 'change-this-in-production';

  /**
   * Generate CSRF token
   */
  static generate(sessionId: string = 'anonymous'): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString('hex');
    const payload = `${sessionId}:${timestamp}:${randomBytes}`;
    
    const hmac = crypto.createHmac('sha256', this.SECRET);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    
    return Buffer.from(`${payload}:${signature}`).toString('base64');
  }

  /**
   * Verify CSRF token
   */
  static verify(token: string, sessionId: string = 'anonymous'): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const parts = decoded.split(':');
      
      if (parts.length !== 4) return false;
      
      const [tokenSessionId, timestamp, randomBytes, signature] = parts;
      
      // Check session ID match
      if (tokenSessionId !== sessionId) return false;
      
      // Check token age (valid for 1 hour)
      const tokenTime = parseInt(timestamp || '0');
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (now - tokenTime > oneHour) return false;
      
      // Verify signature
      const payload = `${tokenSessionId}:${timestamp}:${randomBytes}`;
      const hmac = crypto.createHmac('sha256', this.SECRET);
      hmac.update(payload);
      const expectedSignature = hmac.digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature || '', 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      return false;
    }
  }
}

/**
 * Content Validation
 */
export class ContentValidator {
  /**
   * Validate news content
   */
  static validateNews(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Caption validation
    if (!data.caption || typeof data.caption !== 'string') {
      errors.push('Caption is required');
    } else if (data.caption.length > 200) {
      errors.push('Caption too long (max 200 characters)');
    } else if (data.caption.length < 10) {
      errors.push('Caption too short (min 10 characters)');
    }

    // Content validation
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Content is required');
    } else if (data.content.length > 50000) {
      errors.push('Content too long (max 50000 characters)');
    } else if (data.content.length < 100) {
      errors.push('Content too short (min 100 characters)');
    }

    // Category validation
    const allowedCategories = ['trabzonspor', 'transfer', 'general', 'football'];
    if (!data.category || !allowedCategories.includes(data.category)) {
      errors.push('Invalid category');
    }

    // Type validation
    const allowedTypes = ['news', 'headline', 'subNews'];
    if (!data.type || !allowedTypes.includes(data.type)) {
      errors.push('Invalid type');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate comment content
   */
  static validateComment(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Content validation
    if (!data.content || typeof data.content !== 'string') {
      errors.push('Comment content is required');
    } else if (data.content.length > 1000) {
      errors.push('Comment too long (max 1000 characters)');
    } else if (data.content.length < 3) {
      errors.push('Comment too short (min 3 characters)');
    }

    // Author validation
    if (!data.author || typeof data.author !== 'string') {
      errors.push('Author name is required');
    } else if (data.author.length > 50) {
      errors.push('Author name too long (max 50 characters)');
    }

    // Email validation (if provided)
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // File size validation (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push('File too large (max 5MB)');
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type || file.mimetype)) {
      errors.push('Invalid file type (only JPEG, PNG, WebP allowed)');
    }

    // File name validation
    if (!file.name && !file.originalname) {
      errors.push('File name is required');
    } else {
      const fileName = file.name || file.originalname;
      if (fileName.length > 100) {
        errors.push('File name too long');
      }

      // Check for dangerous file extensions
      const dangerousExtensions = ['.php', '.exe', '.bat', '.cmd', '.scr', '.js', '.html'];
      const haseDangerousExtension = dangerousExtensions.some(ext => 
        fileName.toLowerCase().endsWith(ext)
      );
      
      if (haseDangerousExtension) {
        errors.push('Dangerous file extension detected');
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}

/**
 * Rate Limiting Memory Store
 */
export class MemoryRateLimit {
  private static store = new Map<string, { count: number; resetTime: number }>();

  /**
   * Check if request is allowed
   */
  static isAllowed(
    key: string, 
    windowMs: number = 15 * 60 * 1000, 
    maxRequests: number = 100
  ): boolean {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      // First request or window expired
      this.store.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= maxRequests) {
      // Rate limit exceeded
      return false;
    }

    // Increment counter
    record.count++;
    this.store.set(key, record);
    return true;
  }

  /**
   * Get remaining requests
   */
  static getRemaining(key: string, maxRequests: number = 100): number {
    const record = this.store.get(key);
    if (!record) return maxRequests;
    
    return Math.max(0, maxRequests - record.count);
  }

  /**
   * Clean expired records (call periodically)
   */
  static cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Security Audit Logger
 */
export class SecurityAuditLogger {
  /**
   * Log security event
   */
  static log(event: {
    type: 'CSRF_VIOLATION' | 'RATE_LIMIT_EXCEEDED' | 'INVALID_INPUT' | 'FILE_UPLOAD_REJECTED' | 'XSS_ATTEMPT';
    ip: string;
    userAgent?: string | undefined;
    path: string;
    details?: any;
  }): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...event
    };

    // In production, send to monitoring service
    console.warn('[SECURITY AUDIT]', JSON.stringify(logEntry, null, 2));

    // Store in database for analysis
    // await storeSecurityLog(logEntry);
  }
}

export default {
  SimpleSanitizer,
  CSRFTokenGenerator,
  ContentValidator,
  MemoryRateLimit,
  SecurityAuditLogger
};