/**
 * Security API Endpoints Test Suite
 * Tests for security-related API endpoints
 * @jest-environment node
 */

import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../../../pages/api/security/csrf';
import validateHandler from '../../../pages/api/security/validate';

// Mock the security utilities
jest.mock('../../../lib/security/utils', () => ({
  CSRFTokenGenerator: {
    generate: jest.fn().mockReturnValue('mocked-csrf-token'),
    verify: jest.fn().mockReturnValue(true)
  },
  ContentValidator: {
    validateNews: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    validateComment: jest.fn().mockReturnValue({ isValid: true, errors: [] }),
    validateFileUpload: jest.fn().mockReturnValue({ isValid: true, errors: [] })
  }
}));

// Helper function to create mock req/res
function createMocks(method: string, body?: any, query?: any) {
  const req = {
    method,
    body,
    query,
    headers: {},
    cookies: {}
  } as NextApiRequest;

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    end: jest.fn()
  } as unknown as NextApiResponse;

  return { req, res };
}

describe('/api/security/csrf', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate CSRF token for GET request', async () => {
    const { req, res } = createMocks('GET');
    req.headers['x-forwarded-for'] = '127.0.0.1';
    
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      token: 'mocked-csrf-token'
    });
  });

  it('should verify CSRF token for POST request', async () => {
    const { req, res } = createMocks('POST', { token: 'test-token' });
    req.headers['x-forwarded-for'] = '127.0.0.1';
    
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      valid: true
    });
  });

  it('should return 405 for unsupported methods', async () => {
    const { req, res } = createMocks('PUT');
    
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Method not allowed'
    });
  });

  it('should handle missing token in POST request', async () => {
    const { req, res } = createMocks('POST', {});
    req.headers['x-forwarded-for'] = '127.0.0.1';
    
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Token is required'
    });
  });

  it('should handle rate limiting', async () => {
    const { req, res } = createMocks('GET');
    req.headers['x-forwarded-for'] = '127.0.0.1';
    
    // Mock rate limiting by making multiple requests
    for (let i = 0; i < 10; i++) {
      await handler(req, res);
    }

    // The handler should still work as rate limiting is mocked
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('should handle missing IP address', async () => {
    const { req, res } = createMocks('GET');
    // No IP address in headers
    
    await handler(req, res);

    // Should still work with fallback IP
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('/api/security/validate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate news data', async () => {
    const { req, res } = createMocks('POST', {
      type: 'news',
      data: {
        caption: 'Test News',
        content: 'Valid news content with sufficient length for validation testing.',
        category: 'trabzonspor',
        type: 'news'
      }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      valid: true,
      errors: []
    });
  });

  it('should validate comment data', async () => {
    const { req, res } = createMocks('POST', {
      type: 'comment',
      data: {
        content: 'Valid comment content',
        author: 'Test User',
        email: 'test@example.com'
      }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      valid: true,
      errors: []
    });
  });

  it('should validate file upload data', async () => {
    const { req, res } = createMocks('POST', {
      type: 'file',
      data: {
        size: 1024 * 1024, // 1MB
        type: 'image/jpeg',
        name: 'test.jpg'
      }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      valid: true,
      errors: []
    });
  });

  it('should return 400 for missing type', async () => {
    const { req, res } = createMocks('POST', {
      data: { test: 'data' }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation type and data are required'
    });
  });

  it('should return 400 for missing data', async () => {
    const { req, res } = createMocks('POST', {
      type: 'news'
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Validation type and data are required'
    });
  });

  it('should return 400 for invalid validation type', async () => {
    const { req, res } = createMocks('POST', {
      type: 'invalid',
      data: { test: 'data' }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid validation type'
    });
  });

  it('should return 405 for GET request', async () => {
    const { req, res } = createMocks('GET');
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Method not allowed'
    });
  });

  it('should handle validation errors', async () => {
    // Mock validation to return errors
    const { ContentValidator } = require('../../../lib/security/utils');
    ContentValidator.validateNews.mockReturnValueOnce({
      isValid: false,
      errors: ['Caption is required', 'Content too short']
    });

    const { req, res } = createMocks('POST', {
      type: 'news',
      data: {
        caption: '',
        content: 'Short',
        category: 'trabzonspor'
      }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      valid: false,
      errors: ['Caption is required', 'Content too short']
    });
  });
});

describe('Security API Error Handling', () => {
  it('should handle internal server errors in CSRF endpoint', async () => {
    // Mock CSRFTokenGenerator to throw error
    const { CSRFTokenGenerator } = require('../../../lib/security/utils');
    CSRFTokenGenerator.generate.mockImplementationOnce(() => {
      throw new Error('Internal error');
    });

    const { req, res } = createMocks('GET');
    req.headers['x-forwarded-for'] = '127.0.0.1';
    
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
  });

  it('should handle internal server errors in validation endpoint', async () => {
    // Mock ContentValidator to throw error
    const { ContentValidator } = require('../../../lib/security/utils');
    ContentValidator.validateNews.mockImplementationOnce(() => {
      throw new Error('Validation error');
    });

    const { req, res } = createMocks('POST', {
      type: 'news',
      data: { test: 'data' }
    });
    
    await validateHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error'
    });
  });
});