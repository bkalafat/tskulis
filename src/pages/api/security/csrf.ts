/**
 * CSRF Token API Endpoint
 * Generates and validates CSRF tokens for client requests
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { CSRFTokenGenerator } from '../../../lib/security/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    try {
      // Get session ID from cookie or generate anonymous ID
      const sessionId = req.cookies['session-id'] || `anonymous_${Date.now()}`;

      // Generate CSRF token
      const token = CSRFTokenGenerator.generate(sessionId);

      // Set session cookie if not exists
      if (!req.cookies['session-id']) {
        res.setHeader('Set-Cookie', [
          `session-id=${sessionId}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Strict; Max-Age=86400; Path=/`
        ]);
      }

      return res.status(200).json({ 
        csrfToken: token,
        sessionId: sessionId 
      });
    } catch (error) {
      console.error('CSRF token generation error:', error);
      return res.status(500).json({ error: 'Failed to generate CSRF token' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { token, sessionId } = req.body;

      if (!token || !sessionId) {
        return res.status(400).json({ error: 'Token and sessionId are required' });
      }

      // Verify CSRF token
      const isValid = CSRFTokenGenerator.verify(token, sessionId);

      return res.status(200).json({ 
        valid: isValid,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('CSRF token validation error:', error);
      return res.status(500).json({ error: 'Failed to validate CSRF token' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}