/**
 * Input Validation API Endpoint
 * Validates user input for security threats
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { ContentValidator, SimpleSanitizer, SecurityAuditLogger } from '../../../lib/security/utils';

type ValidationRequest = {
  type: 'news' | 'comment' | 'file';
  data: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, data }: ValidationRequest = req.body;

    if (!type || !data) {
      return res.status(400).json({ 
        error: 'Type and data are required',
        valid: false 
      });
    }

    let validationResult: { isValid: boolean; errors: string[] };
    let sanitizedData: any = data;

    // Get client IP for audit logging
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';

    switch (type) {
      case 'news':
        // Sanitize news content
        if (data.content) {
          sanitizedData.content = SimpleSanitizer.sanitizeNewsContent(data.content);
        }
        if (data.caption) {
          sanitizedData.caption = SimpleSanitizer.sanitizeInput(data.caption);
        }
        
        // Validate news data
        validationResult = ContentValidator.validateNews(sanitizedData);
        break;

      case 'comment':
        // Sanitize comment content
        if (data.content) {
          sanitizedData.content = SimpleSanitizer.sanitizeHtml(data.content);
        }
        if (data.author) {
          sanitizedData.author = SimpleSanitizer.sanitizeInput(data.author);
        }
        
        // Validate comment data
        validationResult = ContentValidator.validateComment(sanitizedData);
        break;

      case 'file':
        // Validate file upload
        validationResult = ContentValidator.validateFileUpload(data);
        break;

      default:
        return res.status(400).json({ 
          error: 'Invalid validation type',
          valid: false 
        });
    }

    // Log security violations
    if (!validationResult.isValid) {
      SecurityAuditLogger.log({
        type: 'INVALID_INPUT',
        ip: clientIP.toString(),
        userAgent: req.headers['user-agent'],
        path: req.url || '/api/security/validate',
        details: {
          validationType: type,
          errors: validationResult.errors,
          originalData: data
        }
      });
    }

    return res.status(200).json({
      valid: validationResult.isValid,
      errors: validationResult.errors,
      sanitizedData: validationResult.isValid ? sanitizedData : null
    });

  } catch (error) {
    console.error('Validation error:', error);
    
    // Log the error for security monitoring
    SecurityAuditLogger.log({
      type: 'INVALID_INPUT',
      ip: (req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown').toString(),
      userAgent: req.headers['user-agent'],
      path: req.url || '/api/security/validate',
      details: {
        error: error instanceof Error ? error.message : 'Unknown error',
        requestBody: req.body
      }
    });

    return res.status(500).json({ 
      error: 'Validation service error',
      valid: false 
    });
  }
}