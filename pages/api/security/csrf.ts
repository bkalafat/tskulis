/**
 * CSRF Token API Endpoint
 * Generates and verifies CSRF tokens for security protection
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { CSRFTokenGenerator, MemoryRateLimit, SecurityAuditLogger } from '../../../src/lib/security/utils';

interface CSRFResponse {
  token?: string;
  valid?: boolean;
  error?: string;
}

function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : 
             req.headers['x-real-ip'] as string ||
             req.connection?.remoteAddress ||
             '127.0.0.1';
  return ip || '127.0.0.1';
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CSRFResponse>
) {
  const clientIP = getClientIP(req);
  
  try {
    // Rate limiting: 30 requests per minute per IP
    if (!MemoryRateLimit.isAllowed(clientIP, 60000, 30)) {
      SecurityAuditLogger.log({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: clientIP,
        path: req.url || '/api/security/csrf',
        userAgent: req.headers['user-agent'] || undefined,
        details: { endpoint: 'csrf' }
      });
      
      return res.status(429).json({ 
        error: 'Too many requests' 
      });
    }

    if (req.method === 'GET') {
      // Generate new CSRF token
      const sessionId = `${clientIP}-${Date.now()}`;
      const token = CSRFTokenGenerator.generate(sessionId);
      
      // Store session ID in cookie for verification
      res.setHeader('Set-Cookie', `csrf_session=${sessionId}; HttpOnly; SameSite=Strict; Path=/`);
      
      return res.status(200).json({ token });
      
    } else if (req.method === 'POST') {
      // Verify CSRF token
      const { token } = req.body;
      const sessionId = req.cookies.csrf_session;
      
      if (!token) {
        SecurityAuditLogger.log({
          type: 'CSRF_VIOLATION',
          ip: clientIP,
          path: req.url || '/api/security/csrf',
          userAgent: req.headers['user-agent'] || undefined,
          details: { reason: 'missing_token' }
        });
        
        return res.status(400).json({ 
          error: 'Token is required' 
        });
      }
      
      if (!sessionId) {
        SecurityAuditLogger.log({
          type: 'CSRF_VIOLATION',
          ip: clientIP,
          path: req.url || '/api/security/csrf',
          userAgent: req.headers['user-agent'] || undefined,
          details: { reason: 'missing_session' }
        });
        
        return res.status(400).json({ 
          error: 'Session not found' 
        });
      }
      
      const isValid = CSRFTokenGenerator.verify(token, sessionId);
      
      if (!isValid) {
        SecurityAuditLogger.log({
          type: 'CSRF_VIOLATION',
          ip: clientIP,
          path: req.url || '/api/security/csrf',
          userAgent: req.headers['user-agent'] || undefined,
          details: { reason: 'invalid_token' }
        });
      }
      
      return res.status(200).json({ valid: isValid });
      
    } else {
      return res.status(405).json({ 
        error: 'Method not allowed' 
      });
    }
    
  } catch (error) {
    console.error('CSRF endpoint error:', error);
    
    SecurityAuditLogger.log({
      type: 'XSS_ATTEMPT',
      ip: clientIP,
      path: req.url || '/api/security/csrf',
      userAgent: req.headers['user-agent'] || undefined,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: 'csrf'
      }
    });
    
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}