/**
 * Content Validation API Endpoint
 * Validates different types of content (news, comments, files)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentValidator, MemoryRateLimit, SecurityAuditLogger } from '../../../src/lib/security/utils';

interface ValidationResponse {
  valid?: boolean;
  errors?: string[];
  sanitizedData?: any;
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
  res: NextApiResponse<ValidationResponse>
) {
  const clientIP = getClientIP(req);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed' 
    });
  }
  
  try {
    // Rate limiting: 60 requests per minute per IP
    if (!MemoryRateLimit.isAllowed(clientIP, 60000, 60)) {
      SecurityAuditLogger.log({
        type: 'RATE_LIMIT_EXCEEDED',
        ip: clientIP,
        path: req.url || '/api/security/validate',
        userAgent: req.headers['user-agent'] || undefined,
        details: { endpoint: 'validate' }
      });
      
      return res.status(429).json({ 
        error: 'Too many requests' 
      });
    }

    const { type, data } = req.body;
    
    if (!type || !data) {
      SecurityAuditLogger.log({
        type: 'INVALID_INPUT',
        ip: clientIP,
        path: req.url || '/api/security/validate',
        userAgent: req.headers['user-agent'] || undefined,
        details: { reason: 'missing_type_or_data' }
      });
      
      return res.status(400).json({ 
        error: 'Validation type and data are required' 
      });
    }

    let result: { isValid: boolean; errors: string[]; sanitizedData?: any };

    switch (type) {
      case 'news':
        result = ContentValidator.validateNews(data);
        break;
        
      case 'comment':
        result = ContentValidator.validateComment(data);
        break;
        
      case 'file':
        result = ContentValidator.validateFileUpload(data);
        break;
        
      default:
        SecurityAuditLogger.log({
          type: 'INVALID_INPUT',
          ip: clientIP,
          path: req.url || '/api/security/validate',
          userAgent: req.headers['user-agent'] || undefined,
          details: { reason: 'invalid_validation_type', type }
        });
        
        return res.status(400).json({ 
          error: 'Invalid validation type' 
        });
    }

    // Log validation failures for security monitoring
    if (!result.isValid && result.errors.length > 0) {
      const suspiciousErrors = result.errors.filter(error => 
        error.includes('dangerous') || 
        error.includes('malicious') || 
        error.includes('script') ||
        error.includes('injection')
      );
      
      if (suspiciousErrors.length > 0) {
        SecurityAuditLogger.log({
          type: 'XSS_ATTEMPT',
          ip: clientIP,
          path: req.url || '/api/security/validate',
          userAgent: req.headers['user-agent'] || undefined,
          details: { 
            validationType: type,
            suspiciousContent: suspiciousErrors,
            data: typeof data === 'object' ? JSON.stringify(data).substring(0, 200) : String(data).substring(0, 200)
          }
        });
      }
    }

    return res.status(200).json({
      valid: result.isValid,
      errors: result.errors,
      sanitizedData: result.sanitizedData
    });
    
  } catch (error) {
    console.error('Validation endpoint error:', error);
    
    SecurityAuditLogger.log({
      type: 'XSS_ATTEMPT',
      ip: clientIP,
      path: req.url || '/api/security/validate',
      userAgent: req.headers['user-agent'] || undefined,
      details: { 
        error: error instanceof Error ? error.message : 'Unknown error',
        endpoint: 'validate'
      }
    });
    
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
}