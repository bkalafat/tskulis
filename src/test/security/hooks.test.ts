/**
 * Security Hooks Test Suite
 * Tests for React security hooks
 */

import { renderHook, act } from '@testing-library/react';
import { 
  useCSRFToken,
  useInputSanitizer,
  useSecureAPI,
  useContentValidator,
  useXSSProtection
} from '../../hooks/security';

// Mock fetch for API tests
global.fetch = jest.fn();

describe('useCSRFToken', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should fetch CSRF token on mount', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'test-csrf-token' })
    });

    const { result } = renderHook(() => useCSRFToken());

    expect(result.current.loading).toBe(true);
    expect(result.current.csrfToken).toBe('');

    // Wait for async operation
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.csrfToken).toBe('test-csrf-token');
    expect(fetch).toHaveBeenCalledWith('/api/security/csrf');
  });

  it('should handle CSRF token fetch error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useCSRFToken());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.csrfToken).toBe('');
    expect(result.current.error).toBe('Failed to fetch CSRF token');
  });

  it('should refresh token when requested', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'initial-token' })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: 'refreshed-token' })
      });

    const { result } = renderHook(() => useCSRFToken());

    // Wait for initial fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.csrfToken).toBe('initial-token');

    // Refresh token
    await act(async () => {
      result.current.refreshToken();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.csrfToken).toBe('refreshed-token');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

describe('useInputSanitizer', () => {
  it('should sanitize input text', () => {
    const { result } = renderHook(() => useInputSanitizer());
    
    const maliciousInput = '<script>alert("xss")</script>Hello World';
    const sanitized = result.current.sanitizeInput(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello World');
  });

  it('should sanitize HTML content', () => {
    const { result } = renderHook(() => useInputSanitizer());
    
    const maliciousHtml = '<script>alert("xss")</script><p>Safe content</p><img onerror="alert()" src="x">';
    const sanitized = result.current.sanitizeHtml(maliciousHtml);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('onerror');
    expect(sanitized).toContain('<p>Safe content</p>');
  });

  it('should sanitize news content with allowed tags', () => {
    const { result } = renderHook(() => useInputSanitizer());
    
    const newsContent = '<p>News content</p><strong>Important</strong><script>alert()</script>';
    const sanitized = result.current.sanitizeNewsContent(newsContent);
    
    expect(sanitized).toContain('<p>News content</p>');
    expect(sanitized).toContain('<strong>Important</strong>');
    expect(sanitized).not.toContain('<script>');
  });

  it('should handle null and undefined inputs gracefully', () => {
    const { result } = renderHook(() => useInputSanitizer());
    
    expect(result.current.sanitizeInput(null as any)).toBe('');
    expect(result.current.sanitizeInput(undefined as any)).toBe('');
    expect(result.current.sanitizeHtml(null as any)).toBe('');
  });
});

describe('useSecureAPI', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('should make secure request', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: 'test' })
    });

    const { result } = renderHook(() => useSecureAPI());
    
    const response = await act(async () => {
      return result.current.secureRequest('/api/test');
    });

    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toEqual({ data: 'test' });
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  });

  it('should make secure POST request with CSRF token', async () => {
    // Mock CSRF token fetch
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

    const { result } = renderHook(() => useSecureAPI());
    
    const data = { test: 'data' };
    const response = await act(async () => {
      return result.current.secureRequest('/api/test', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    });

    expect(response.ok).toBe(true);
    expect(fetch).toHaveBeenCalledWith('/api/test', {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
      }
    });
  });

  it('should handle API errors', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    });

    const { result } = renderHook(() => useSecureAPI());
    
    const response = await act(async () => {
      return result.current.secureRequest('/api/test');
    });

    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
  });

  it('should handle network errors', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSecureAPI());
    
    await expect(
      act(async () => result.current.secureRequest('/api/test'))
    ).rejects.toThrow('Network error');
  });
});

describe('useContentValidator', () => {
  it('should validate news content', async () => {
    const { result } = renderHook(() => useContentValidator());
    
    const validNews = {
      caption: 'Test News',
      content: 'This is a valid news content that is long enough to pass validation and contains proper information.',
      category: 'trabzonspor',
      type: 'news'
    };

    const validation = await act(async () => {
      return result.current.validateContent('news', validNews);
    });
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate comment content', async () => {
    const { result } = renderHook(() => useContentValidator());
    
    const validComment = {
      content: 'This is a valid comment',
      author: 'Test User',
      email: 'test@example.com'
    };

    const validation = await act(async () => {
      return result.current.validateContent('comment', validComment);
    });
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should validate file uploads', async () => {
    const { result } = renderHook(() => useContentValidator());
    
    const validFile = {
      size: 1024 * 1024, // 1MB
      type: 'image/jpeg',
      name: 'test.jpg'
    };

    const validation = await act(async () => {
      return result.current.validateContent('file', validFile);
    });
    
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should reject invalid news', async () => {
    const { result } = renderHook(() => useContentValidator());
    
    const invalidNews = {
      caption: '', // Empty caption
      content: 'Short', // Too short
      category: 'invalid', // Invalid category
      type: 'news'
    };

    const validation = await act(async () => {
      return result.current.validateContent('news', invalidNews);
    });
    
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

describe('useXSSProtection', () => {
  it('should detect unsafe content', () => {
    const { result } = renderHook(() => useXSSProtection());
    
    const maliciousContent = '<script>alert("xss")</script>';
    const isSafe = result.current.isContentSafe(maliciousContent);
    
    expect(isSafe).toBe(false);
  });

  it('should detect safe content', () => {
    const { result } = renderHook(() => useXSSProtection());
    
    const safeContent = '<p>This is safe content with <strong>bold</strong> text.</p>';
    const isSafe = result.current.isContentSafe(safeContent);
    
    expect(isSafe).toBe(true);
  });

  it('should create safe HTML', () => {
    const { result } = renderHook(() => useXSSProtection());
    
    const maliciousContent = '<script>alert("xss")</script><p>Safe content</p>';
    const safeHTML = result.current.createSafeHTML(maliciousContent);
    
    expect(safeHTML.__html).not.toContain('<script>');
    expect(safeHTML.__html).toContain('<p>Safe content</p>');
  });

  it('should handle empty content', () => {
    const { result } = renderHook(() => useXSSProtection());
    
    const content = '';
    const isSafe = result.current.isContentSafe(content);
    const safeHTML = result.current.createSafeHTML(content);
    
    expect(isSafe).toBe(true);
    expect(safeHTML.__html).toBe('');
  });

  it('should handle null and undefined content', () => {
    const { result } = renderHook(() => useXSSProtection());
    
    const nullContent = null as any;
    const undefinedContent = undefined as any;
    
    expect(result.current.isContentSafe(nullContent)).toBe(true);
    expect(result.current.isContentSafe(undefinedContent)).toBe(true);
    expect(result.current.createSafeHTML(nullContent).__html).toBe('');
    expect(result.current.createSafeHTML(undefinedContent).__html).toBe('');
  });
});