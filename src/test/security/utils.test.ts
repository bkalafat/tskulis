/**
 * Security Utilities Test Suite
 * Tests for security functions and validation
 * @jest-environment node
 */

import { 
  SimpleSanitizer, 
  CSRFTokenGenerator, 
  ContentValidator,
  MemoryRateLimit,
  SecurityAuditLogger
} from '../../lib/security/utils';

describe('SimpleSanitizer', () => {
  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script><p>Safe content</p>';
      const result = SimpleSanitizer.sanitizeHtml(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('should remove dangerous protocols', () => {
      const malicious = 'javascript:alert("xss")';
      const result = SimpleSanitizer.sanitizeHtml(malicious);
      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const malicious = '<div onclick="alert()">Content</div>';
      const result = SimpleSanitizer.sanitizeHtml(malicious);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Content');
    });

    it('should handle empty input', () => {
      expect(SimpleSanitizer.sanitizeHtml('')).toBe('');
      expect(SimpleSanitizer.sanitizeHtml(null as any)).toBe('');
      expect(SimpleSanitizer.sanitizeHtml(undefined as any)).toBe('');
    });

    it('should limit content length', () => {
      const longContent = 'a'.repeat(20000);
      const result = SimpleSanitizer.sanitizeHtml(longContent);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('sanitizeInput', () => {
    it('should remove HTML brackets', () => {
      const input = '<script>alert()</script>';
      const result = SimpleSanitizer.sanitizeInput(input);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should remove quotes and semicolons', () => {
      const input = 'test"value\'test;DROP TABLE';
      const result = SimpleSanitizer.sanitizeInput(input);
      expect(result).not.toContain('"');
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
    });

    it('should trim whitespace', () => {
      const input = '  test content  ';
      const result = SimpleSanitizer.sanitizeInput(input);
      expect(result).toBe('test content');
    });
  });

  describe('sanitizeNewsContent', () => {
    it('should preserve allowed HTML tags', () => {
      const content = '<p>This is a <strong>news</strong> article.</p>';
      const result = SimpleSanitizer.sanitizeNewsContent(content);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('news');
    });

    it('should remove disallowed tags', () => {
      const content = '<script>alert()</script><form><input></form><p>Safe content</p>';
      const result = SimpleSanitizer.sanitizeNewsContent(content);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<form>');
      expect(result).not.toContain('<input>');
      expect(result).toContain('<p>Safe content</p>');
    });

    it('should handle very long content', () => {
      const longContent = '<p>' + 'a'.repeat(60000) + '</p>';
      const result = SimpleSanitizer.sanitizeNewsContent(longContent);
      expect(result.length).toBeLessThanOrEqual(50000);
    });
  });
});

describe('CSRFTokenGenerator', () => {
  describe('generate', () => {
    it('should generate a valid base64 token', () => {
      const token = CSRFTokenGenerator.generate('test-session');
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      
      // Should be valid base64
      expect(() => Buffer.from(token, 'base64')).not.toThrow();
    });

    it('should generate different tokens for different sessions', () => {
      const token1 = CSRFTokenGenerator.generate('session1');
      const token2 = CSRFTokenGenerator.generate('session2');
      expect(token1).not.toBe(token2);
    });
  });

  describe('verify', () => {
    it('should verify a valid token', () => {
      const sessionId = 'test-session';
      const token = CSRFTokenGenerator.generate(sessionId);
      const isValid = CSRFTokenGenerator.verify(token, sessionId);
      expect(isValid).toBe(true);
    });

    it('should reject token for wrong session', () => {
      const token = CSRFTokenGenerator.generate('session1');
      const isValid = CSRFTokenGenerator.verify(token, 'session2');
      expect(isValid).toBe(false);
    });

    it('should reject malformed tokens', () => {
      const isValid = CSRFTokenGenerator.verify('invalid-token', 'session');
      expect(isValid).toBe(false);
    });

    it('should reject empty tokens', () => {
      const isValid = CSRFTokenGenerator.verify('', 'session');
      expect(isValid).toBe(false);
    });
  });
});

describe('ContentValidator', () => {
  describe('validateNews', () => {
    it('should validate correct news data', () => {
      const newsData = {
        caption: 'Test news caption',
        content: 'This is a test news content with more than 100 characters to pass the minimum length validation. This should be long enough.',
        category: 'trabzonspor',
        type: 'news'
      };

      const result = ContentValidator.validateNews(newsData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject news with invalid category', () => {
      const newsData = {
        caption: 'Test caption',
        content: 'Valid content that is long enough to pass validation requirements and has sufficient length for testing.',
        category: 'invalid-category',
        type: 'news'
      };

      const result = ContentValidator.validateNews(newsData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid category');
    });

    it('should reject news with short content', () => {
      const newsData = {
        caption: 'Test caption',
        content: 'Short', // Too short
        category: 'trabzonspor',
        type: 'news'
      };

      const result = ContentValidator.validateNews(newsData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Content too short (min 100 characters)');
    });

    it('should reject news with long caption', () => {
      const newsData = {
        caption: 'A'.repeat(250), // Too long
        content: 'This is valid content that meets the minimum length requirement for news content validation testing.',
        category: 'trabzonspor',
        type: 'news'
      };

      const result = ContentValidator.validateNews(newsData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Caption too long (max 200 characters)');
    });
  });

  describe('validateComment', () => {
    it('should validate correct comment data', () => {
      const commentData = {
        content: 'This is a valid comment',
        author: 'Test User',
        email: 'test@example.com'
      };

      const result = ContentValidator.validateComment(commentData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject comment with invalid email', () => {
      const commentData = {
        content: 'Valid comment content',
        author: 'Test User',
        email: 'invalid-email'
      };

      const result = ContentValidator.validateComment(commentData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });

    it('should reject comment with long content', () => {
      const commentData = {
        content: 'A'.repeat(1500), // Too long
        author: 'Test User'
      };

      const result = ContentValidator.validateComment(commentData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Comment too long (max 1000 characters)');
    });
  });

  describe('validateFileUpload', () => {
    it('should validate correct file', () => {
      const file = {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        name: 'test.jpg'
      };

      const result = ContentValidator.validateFileUpload(file);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized file', () => {
      const file = {
        size: 10 * 1024 * 1024, // 10MB
        type: 'image/jpeg',
        name: 'large.jpg'
      };

      const result = ContentValidator.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File too large (max 5MB)');
    });

    it('should reject invalid file type', () => {
      const file = {
        size: 1024,
        type: 'text/plain',
        name: 'test.txt'
      };

      const result = ContentValidator.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid file type (only JPEG, PNG, WebP allowed)');
    });

    it('should reject dangerous file extension', () => {
      const file = {
        size: 1024,
        type: 'image/jpeg',
        name: 'malicious.php'
      };

      const result = ContentValidator.validateFileUpload(file);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Dangerous file extension detected');
    });
  });
});

describe('MemoryRateLimit', () => {
  beforeEach(() => {
    // Clear rate limit store before each test
    MemoryRateLimit.cleanup();
  });

  it('should allow requests within limit', () => {
    const key = 'test-key';
    
    expect(MemoryRateLimit.isAllowed(key, 60000, 5)).toBe(true);
    expect(MemoryRateLimit.isAllowed(key, 60000, 5)).toBe(true);
    expect(MemoryRateLimit.isAllowed(key, 60000, 5)).toBe(true);
  });

  it('should block requests exceeding limit', () => {
    const key = 'test-key';
    const windowMs = 60000;
    const maxRequests = 3;
    
    // Use up all allowed requests
    for (let i = 0; i < maxRequests; i++) {
      expect(MemoryRateLimit.isAllowed(key, windowMs, maxRequests)).toBe(true);
    }
    
    // Next request should be blocked
    expect(MemoryRateLimit.isAllowed(key, windowMs, maxRequests)).toBe(false);
  });

  it('should track remaining requests', () => {
    const key = 'test-key';
    const maxRequests = 5;
    
    expect(MemoryRateLimit.getRemaining(key, maxRequests)).toBe(5);
    
    MemoryRateLimit.isAllowed(key, 60000, maxRequests);
    expect(MemoryRateLimit.getRemaining(key, maxRequests)).toBe(4);
    
    MemoryRateLimit.isAllowed(key, 60000, maxRequests);
    expect(MemoryRateLimit.getRemaining(key, maxRequests)).toBe(3);
  });
});

describe('SecurityAuditLogger', () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should log security events', () => {
    const event = {
      type: 'CSRF_VIOLATION' as const,
      ip: '127.0.0.1',
      userAgent: 'test-agent',
      path: '/test',
      details: { reason: 'missing token' }
    };

    SecurityAuditLogger.log(event);

    expect(consoleSpy).toHaveBeenCalledWith(
      '[SECURITY AUDIT]',
      expect.stringContaining('CSRF_VIOLATION')
    );
  });

  it('should include timestamp in log entry', () => {
    const event = {
      type: 'XSS_ATTEMPT' as const,
      ip: '127.0.0.1',
      path: '/test'
    };

    SecurityAuditLogger.log(event);

    const logCall = consoleSpy.mock.calls[0];
    const logEntry = JSON.parse(logCall[1]);
    expect(logEntry.timestamp).toBeDefined();
    expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date);
  });
});