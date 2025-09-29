import { NextApiRequest, NextApiResponse } from 'next';
import { DependencySecurityScanner } from '../../../lib/security/dependency-scanner';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type } = req.body;
    
    if (type !== 'csp-violation') {
      return res.status(400).json({ message: 'Invalid report type' });
    }

    // Log CSP violation for security monitoring
    const violation = req.body['csp-report'];
    
    if (violation) {
      console.warn('CSP Violation detected:', {
        blockedUri: violation['blocked-uri'],
        documentUri: violation['document-uri'],
        originalPolicy: violation['original-policy'],
        referrer: violation.referrer,
        violatedDirective: violation['violated-directive'],
        timestamp: new Date().toISOString(),
        userAgent: req.headers['user-agent'],
        ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress
      });

      // In production, you might want to:
      // 1. Store violations in database for analysis
      // 2. Send alerts for critical violations
      // 3. Update CSP policies based on legitimate violations
      
      // Optional: Run dependency scan if there are script violations
      if (violation['violated-directive']?.includes('script-src')) {
        try {
          const scanner = new DependencySecurityScanner();
          const scanResults = await scanner.runAudit();
          
          if (scanResults.summary.high > 0) {
            console.warn('High severity vulnerabilities detected during CSP violation analysis');
          }
        } catch (scanError) {
          console.error('Error during security scan:', scanError);
        }
      }
    }

    res.status(204).end();
  } catch (error) {
    console.error('Error processing security report:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}