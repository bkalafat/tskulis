/**
 * Health Check API Endpoint
 * Provides comprehensive application health status for load balancers and monitoring
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoClient } from 'mongodb';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    api: HealthCheck;
    memory: HealthCheck;
    disk: HealthCheck;
  };
  metadata: {
    nodeVersion: string;
    nextVersion: string;
    buildTime?: string;
    commitHash?: string;
  };
}

interface HealthCheck {
  status: 'pass' | 'warn' | 'fail';
  responseTime?: number;
  message?: string;
  details?: any;
}

// Cache health check results for 30 seconds to prevent excessive load
let lastHealthCheck: { timestamp: number; result: HealthCheckResponse } | null = null;
const CACHE_DURATION = 30000; // 30 seconds

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: { status: 'fail', message: 'Method not allowed' },
        api: { status: 'fail', message: 'Method not allowed' },
        memory: { status: 'fail', message: 'Method not allowed' },
        disk: { status: 'fail', message: 'Method not allowed' },
      },
      metadata: {
        nodeVersion: process.version,
        nextVersion: process.env.npm_package_dependencies_next || 'unknown',
      },
    } as HealthCheckResponse);
  }

  try {
    // Check cache first
    const now = Date.now();
    if (lastHealthCheck && (now - lastHealthCheck.timestamp) < CACHE_DURATION) {
      return res.status(200).json(lastHealthCheck.result);
    }

    const startTime = Date.now();
    
    // Run health checks in parallel
    const [databaseCheck, apiCheck, memoryCheck, diskCheck] = await Promise.allSettled([
      checkDatabase(),
      checkExternalApi(),
      checkMemory(),
      checkDisk(),
    ]);

    const checks = {
      database: databaseCheck.status === 'fulfilled' ? databaseCheck.value : { status: 'fail' as const, message: databaseCheck.reason?.message || 'Unknown error' },
      api: apiCheck.status === 'fulfilled' ? apiCheck.value : { status: 'fail' as const, message: apiCheck.reason?.message || 'Unknown error' },
      memory: memoryCheck.status === 'fulfilled' ? memoryCheck.value : { status: 'fail' as const, message: memoryCheck.reason?.message || 'Unknown error' },
      disk: diskCheck.status === 'fulfilled' ? diskCheck.value : { status: 'fail' as const, message: diskCheck.reason?.message || 'Unknown error' },
    };

    // Determine overall status
    const overallStatus = determineOverallStatus(checks);
    const responseTime = Date.now() - startTime;

    const healthResponse: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks,
      metadata: {
        nodeVersion: process.version,
        nextVersion: process.env.npm_package_dependencies_next || 'unknown',
        buildTime: process.env.BUILD_TIME,
        commitHash: process.env.COMMIT_HASH,
      },
    };

    // Cache the result
    lastHealthCheck = {
      timestamp: now,
      result: healthResponse,
    };

    // Set appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 
                     overallStatus === 'degraded' ? 200 : 503;

    // Set headers for monitoring
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('X-Health-Check-Time', responseTime.toString());

    return res.status(statusCode).json(healthResponse);
  } catch (error) {
    console.error('[Health Check] Unexpected error:', error);
    
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      checks: {
        database: { status: 'fail', message: 'Health check failed' },
        api: { status: 'fail', message: 'Health check failed' },
        memory: { status: 'fail', message: 'Health check failed' },
        disk: { status: 'fail', message: 'Health check failed' },
      },
      metadata: {
        nodeVersion: process.version,
        nextVersion: process.env.npm_package_dependencies_next || 'unknown',
      },
    });
  }
}

// Database connectivity check
async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    if (!process.env.DATABASE_URL && !process.env.MONGODB_URI) {
      return {
        status: 'warn',
        message: 'Database URL not configured',
        responseTime: Date.now() - startTime,
      };
    }

    const uri = process.env.MONGODB_URI || process.env.DATABASE_URL || '';
    const client = new MongoClient(uri);
    
    // Connect with timeout
    await Promise.race([
      client.connect(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);

    // Test basic operations
    const db = client.db();
    await db.admin().ping();
    
    await client.close();

    return {
      status: 'pass',
      responseTime: Date.now() - startTime,
      message: 'Database connection successful',
    };
  } catch (error: any) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: `Database connection failed: ${error.message}`,
    };
  }
}

// External API connectivity check
async function checkExternalApi(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_PATH;
    
    if (!apiUrl) {
      return {
        status: 'warn',
        message: 'External API URL not configured',
        responseTime: Date.now() - startTime,
      };
    }

    // Test external API with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${apiUrl}/health`, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'TS-Kulis-HealthCheck/1.0',
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    return {
      status: 'pass',
      responseTime: Date.now() - startTime,
      message: 'External API accessible',
      details: {
        url: apiUrl,
        status: response.status,
      },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: `External API check failed: ${error.message}`,
    };
  }
}

// Memory usage check
async function checkMemory(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Convert to MB
    const totalMB = Math.round(totalMemory / 1024 / 1024);
    const usedMB = Math.round(usedMemory / 1024 / 1024);

    let status: 'pass' | 'warn' | 'fail' = 'pass';
    let message = `Memory usage: ${usedMB}MB / ${totalMB}MB (${memoryUsagePercent.toFixed(1)}%)`;

    if (memoryUsagePercent > 90) {
      status = 'fail';
      message = `Critical memory usage: ${memoryUsagePercent.toFixed(1)}%`;
    } else if (memoryUsagePercent > 80) {
      status = 'warn';
      message = `High memory usage: ${memoryUsagePercent.toFixed(1)}%`;
    }

    return {
      status,
      responseTime: Date.now() - startTime,
      message,
      details: {
        heapTotal: totalMB,
        heapUsed: usedMB,
        usagePercent: memoryUsagePercent,
        external: Math.round(memUsage.external / 1024 / 1024),
      },
    };
  } catch (error: any) {
    return {
      status: 'fail',
      responseTime: Date.now() - startTime,
      message: `Memory check failed: ${error.message}`,
    };
  }
}

// Disk space check (basic implementation)
async function checkDisk(): Promise<HealthCheck> {
  const startTime = Date.now();
  
  try {
    // Basic disk check - in production, you might want to use a library like 'check-disk-space'
    const fs = await import('fs/promises');
    
    // Check if we can write to temp directory
    const tempPath = '/tmp/health-check-' + Date.now();
    await fs.writeFile(tempPath, 'health-check');
    const stats = await fs.stat(tempPath);
    await fs.unlink(tempPath);

    return {
      status: 'pass',
      responseTime: Date.now() - startTime,
      message: 'Disk write test successful',
      details: {
        testFileSize: stats.size,
      },
    };
  } catch (error: any) {
    // Fallback for environments where disk check isn't available
    return {
      status: 'warn',
      responseTime: Date.now() - startTime,
      message: 'Disk check not available in this environment',
    };
  }
}

// Determine overall health status
function determineOverallStatus(checks: HealthCheckResponse['checks']): 'healthy' | 'degraded' | 'unhealthy' {
  const checkValues = Object.values(checks);
  const failCount = checkValues.filter(check => check.status === 'fail').length;
  const warnCount = checkValues.filter(check => check.status === 'warn').length;

  if (failCount > 0) {
    // If any critical systems fail, mark as unhealthy
    const criticalFailures = [checks.database, checks.api].filter(check => check.status === 'fail').length;
    return criticalFailures > 0 ? 'unhealthy' : 'degraded';
  }

  if (warnCount > 1) {
    return 'degraded';
  }

  return 'healthy';
}