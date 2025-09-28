/**
 * Security React Hooks
 * Custom hooks for handling security features in React components
 */

import { useState, useEffect, useCallback } from 'react';
import { SimpleSanitizer, CSRFTokenGenerator } from '../lib/security/utils';

/**
 * CSRF Token Hook
 * Manages CSRF token for secure API requests
 */
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const fetchCSRFToken = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/security/csrf', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      setCSRFToken(data.csrfToken);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setCSRFToken('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  const refreshToken = useCallback(() => {
    fetchCSRFToken();
  }, [fetchCSRFToken]);

  return { csrfToken, loading, error, refreshToken };
}

/**
 * Input Sanitization Hook
 * Provides sanitization functions for user input
 */
export function useInputSanitizer() {
  const sanitizeHtml = useCallback((input: string): string => {
    return SimpleSanitizer.sanitizeHtml(input);
  }, []);

  const sanitizeInput = useCallback((input: string): string => {
    return SimpleSanitizer.sanitizeInput(input);
  }, []);

  const sanitizeNewsContent = useCallback((content: string): string => {
    return SimpleSanitizer.sanitizeNewsContent(content);
  }, []);

  return {
    sanitizeHtml,
    sanitizeInput,
    sanitizeNewsContent
  };
}

/**
 * Secure API Hook
 * Wraps API calls with security headers and error handling
 */
export function useSecureAPI() {
  const { csrfToken } = useCSRFToken();

  const secureRequest = useCallback(async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const secureOptions: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
        ...options.headers
      },
      credentials: 'include'
    };

    try {
      const response = await fetch(url, secureOptions);
      
      if (response.status === 403) {
        throw new Error('Security violation detected');
      }
      
      if (response.status === 429) {
        throw new Error('Rate limit exceeded');
      }

      return response;
    } catch (error) {
      console.error('Secure API request failed:', error);
      throw error;
    }
  }, [csrfToken]);

  return { secureRequest };
}

/**
 * Content Validation Hook
 * Validates content before submission
 */
export function useContentValidator() {
  const [validating, setValidating] = useState(false);

  const validateContent = useCallback(async (
    type: 'news' | 'comment' | 'file',
    data: any
  ): Promise<{ valid: boolean; errors: string[]; sanitizedData?: any }> => {
    setValidating(true);
    
    try {
      const response = await fetch('/api/security/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ type, data })
      });

      if (!response.ok) {
        throw new Error('Validation service error');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Content validation failed:', error);
      return {
        valid: false,
        errors: ['Validation service unavailable']
      };
    } finally {
      setValidating(false);
    }
  }, []);

  return { validateContent, validating };
}

/**
 * XSS Protection Hook
 * Protects against XSS attacks in rendered content
 */
export function useXSSProtection() {
  const createSafeHTML = useCallback((htmlString: string) => {
    // Sanitize HTML content
    const sanitized = SimpleSanitizer.sanitizeHtml(htmlString);
    
    return {
      __html: sanitized
    };
  }, []);

  const isContentSafe = useCallback((content: string): boolean => {
    // Check for common XSS patterns
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
      /vbscript:/gi
    ];

    return !xssPatterns.some(pattern => pattern.test(content));
  }, []);

  return { createSafeHTML, isContentSafe };
}

/**
 * Security Monitor Hook
 * Monitors and reports security events
 */
export function useSecurityMonitor() {
  const [securityEvents, setSecurityEvents] = useState<Array<{
    type: string;
    timestamp: Date;
    description: string;
  }>>([]);

  const logSecurityEvent = useCallback((
    type: string,
    description: string
  ) => {
    const event = {
      type,
      timestamp: new Date(),
      description
    };

    setSecurityEvents(prev => [...prev, event]);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Event]', event);
    }

    // In production, send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/security/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      }).catch(console.error);
    }
  }, []);

  const clearEvents = useCallback(() => {
    setSecurityEvents([]);
  }, []);

  return {
    securityEvents,
    logSecurityEvent,
    clearEvents
  };
}

export default {
  useCSRFToken,
  useInputSanitizer,
  useSecureAPI,
  useContentValidator,
  useXSSProtection,
  useSecurityMonitor
};