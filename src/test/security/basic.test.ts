/**
 * Simple Security Test
 * Basic security functionality test without complex setup
 */

import * as nodeCrypto from 'crypto';

describe('Basic Security Functions', () => {
  it('should sanitize script tags', () => {
    const maliciousInput = '<script>alert("xss")</script>Hello';
    const sanitized = maliciousInput.replace(/<script[^>]*>.*?<\/script>/gi, '');
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('Hello');
  });

  it('should generate random tokens', () => {
    const token1 = nodeCrypto.randomBytes(32).toString('base64');
    const token2 = nodeCrypto.randomBytes(32).toString('base64');
    
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThan(0);
    expect(token2.length).toBeGreaterThan(0);
  });

  it('should validate email format', () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    expect(emailRegex.test('test@example.com')).toBe(true);
    expect(emailRegex.test('invalid-email')).toBe(false);
    expect(emailRegex.test('')).toBe(false);
  });

  it('should detect dangerous file extensions', () => {
    const dangerousExtensions = ['.exe', '.php', '.asp', '.js'];
    const testFile = 'malicious.php';
    
    const isDangerous = dangerousExtensions.some(ext => 
      testFile.toLowerCase().endsWith(ext)
    );
    
    expect(isDangerous).toBe(true);
    expect(dangerousExtensions.some(ext => 'image.jpg'.toLowerCase().endsWith(ext))).toBe(false);
  });

  it('should limit content length', () => {
    const longContent = 'a'.repeat(10000);
    const maxLength = 5000;
    const truncated = longContent.substring(0, maxLength);
    
    expect(truncated.length).toBe(maxLength);
    expect(truncated.length).toBeLessThan(longContent.length);
  });
});