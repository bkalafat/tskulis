/**
 * Performance Monitoring API Endpoint
 * Receives and processes Real User Monitoring (RUM) data
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { PerformanceEntry } from '../../lib/performance';

interface PerformancePayload {
  entries: PerformanceEntry[];
  timestamp: number;
  url: string;
  userAgent: string;
}

interface PerformanceResponse {
  success: boolean;
  message?: string;
  processed?: number;
}

// In-memory storage for demo (replace with database in production)
const performanceData: PerformanceEntry[] = [];
const maxStorageSize = 10000; // Limit memory usage

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PerformanceResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed. Use POST.',
    });
  }

  try {
    const payload: PerformancePayload = req.body;

    // Validate payload structure
    if (!payload || !Array.isArray(payload.entries)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payload structure. Expected entries array.',
      });
    }

    // Validate entries
    const validEntries = payload.entries.filter(entry => 
      entry && 
      typeof entry.name === 'string' && 
      typeof entry.value === 'number' &&
      entry.timestamp
    );

    if (validEntries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid performance entries found.',
      });
    }

    // Add metadata to entries
    const enrichedEntries = validEntries.map(entry => ({
      ...entry,
      receivedAt: Date.now(),
      userAgent: payload.userAgent || 'unknown',
      sourceUrl: payload.url || 'unknown',
    }));

    // Store entries (trim if needed)
    performanceData.push(...enrichedEntries);
    if (performanceData.length > maxStorageSize) {
      performanceData.splice(0, performanceData.length - maxStorageSize);
    }

    // Process real-time alerts
    await processPerformanceAlerts(enrichedEntries);

    // Log for monitoring
    console.log(`[Performance] Received ${validEntries.length} metrics from ${payload.url}`);

    return res.status(200).json({
      success: true,
      processed: validEntries.length,
    });
  } catch (error) {
    console.error('[Performance] Error processing metrics:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

// Process performance alerts for critical metrics
async function processPerformanceAlerts(entries: PerformanceEntry[]): Promise<void> {
  const alerts: string[] = [];

  entries.forEach(entry => {
    // Alert on poor Core Web Vitals
    if (entry.rating === 'poor' && ['CLS', 'LCP', 'FCP', 'INP', 'TTFB'].includes(entry.name)) {
      alerts.push(`Poor ${entry.name}: ${entry.value} on ${entry.url}`);
    }

    // Alert on extreme values
    if (entry.name === 'LCP' && entry.value > 10000) {
      alerts.push(`Extreme LCP: ${entry.value}ms on ${entry.url}`);
    }
    if (entry.name === 'CLS' && entry.value > 0.5) {
      alerts.push(`Extreme CLS: ${entry.value} on ${entry.url}`);
    }
  });

  // In production, send alerts via email/Slack/etc.
  if (alerts.length > 0) {
    console.warn(`[Performance Alerts] ${alerts.join(', ')}`);
  }
}

// Export performance data getter for analytics (development only)
export function getPerformanceData(): PerformanceEntry[] {
  return [...performanceData];
}

// Export performance summary
export function getPerformanceSummary(): {
  totalEntries: number;
  byMetric: { [key: string]: { count: number; avgValue: number; ratings: { [key: string]: number } } };
  byUrl: { [key: string]: number };
  deviceTypes: { [key: string]: number };
} {
  const summary = {
    totalEntries: performanceData.length,
    byMetric: {} as any,
    byUrl: {} as any,
    deviceTypes: {} as any,
  };

  performanceData.forEach(entry => {
    // By metric
    if (!summary.byMetric[entry.name]) {
      summary.byMetric[entry.name] = { count: 0, totalValue: 0, ratings: {} };
    }
    summary.byMetric[entry.name].count++;
    summary.byMetric[entry.name].totalValue = (summary.byMetric[entry.name].totalValue || 0) + entry.value;
    summary.byMetric[entry.name].ratings[entry.rating] = (summary.byMetric[entry.name].ratings[entry.rating] || 0) + 1;

    // By URL
    summary.byUrl[entry.url] = (summary.byUrl[entry.url] || 0) + 1;

    // By device type
    summary.deviceTypes[entry.deviceType] = (summary.deviceTypes[entry.deviceType] || 0) + 1;
  });

  // Calculate averages
  Object.keys(summary.byMetric).forEach(metric => {
    const metricData = summary.byMetric[metric];
    metricData.avgValue = metricData.totalValue / metricData.count;
    delete metricData.totalValue;
  });

  return summary;
}