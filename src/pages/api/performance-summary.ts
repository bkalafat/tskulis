/**
 * Performance Summary API Endpoint
 * Returns aggregated performance data for dashboard
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getPerformanceSummary } from './performance';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed. Use GET.',
    });
  }

  try {
    const summary = getPerformanceSummary();
    
    // Add cache headers for performance
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('[Performance Summary] Error:', error);
    return res.status(500).json({
      error: 'Failed to get performance summary',
    });
  }
}