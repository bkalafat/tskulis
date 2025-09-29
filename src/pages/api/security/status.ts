import { NextApiRequest, NextApiResponse } from 'next';
import { SecurityTester } from '../../../lib/security/security-testing';
import { DependencySecurityScanner } from '../../../lib/security/dependency-scanner';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { type = 'all' } = req.query;
    
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Run security tests
    if (type === 'all' || type === 'headers') {
      const tester = new SecurityTester();
      const allTests = await tester.runAllTests();
      const headerSuite = allTests.find(suite => suite.name === 'Security Headers');
      results.headerSecurity = headerSuite;
    }

    // Run dependency scan
    if (type === 'all' || type === 'dependencies') {
      try {
        const scanner = new DependencySecurityScanner();
        const scanResults = await scanner.runAudit();
        results.dependencyScan = {
          totalVulnerabilities: scanResults.totalVulnerabilities,
          summary: scanResults.summary,
          riskScore: scanResults.riskScore,
          recommendations: scanResults.recommendations.slice(0, 5) // Limit for API response
        };
      } catch (error) {
        results.dependencyScan = {
          error: 'Failed to run dependency scan',
          message: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // System security check
    if (type === 'all' || type === 'system') {
      results.systemSecurity = {
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV,
        securityHeaders: {
          cspEnabled: Boolean(process.env.NEXT_PUBLIC_CSP_ENABLED !== 'false'),
          hstsEnabled: Boolean(process.env.NODE_ENV === 'production'),
          csrf: Boolean(process.env.NEXT_PUBLIC_CSRF_ENABLED !== 'false')
        }
      };
    }

    res.status(200).json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Error in security status endpoint:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}