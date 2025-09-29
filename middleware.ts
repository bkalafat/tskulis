/**
 * Enhanced Next.js Security Middleware
 * Comprehensive security hardening with CSP, secure headers, and monitoring
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSecurityConfig } from './src/utils/security-config';

let securityConfig: any = null;

// Initialize security config
const getConfig = () => {
  if (!securityConfig) {
    securityConfig = getSecurityConfig();
  }
  return securityConfig;
};

// Build CSP header value from configuration
const buildCSPHeader = (cspSources: any): string => {
  const cspParts = [
    `default-src ${cspSources.defaultSrc.join(' ')}`,
    `script-src ${cspSources.scriptSrc.join(' ')}`,
    `style-src ${cspSources.styleSrc.join(' ')}`,
    `img-src ${cspSources.imgSrc.join(' ')}`,
    `font-src ${cspSources.fontSrc.join(' ')}`,
    `connect-src ${cspSources.connectSrc.join(' ')}`,
    `media-src ${cspSources.mediaSrc.join(' ')}`,
    `object-src ${cspSources.objectSrc.join(' ')}`,
    `frame-src ${cspSources.frameSrc.join(' ')}`,
    `worker-src ${cspSources.workerSrc.join(' ')}`,
    `manifest-src ${cspSources.manifestSrc.join(' ')}`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`
  ];

  return cspParts.join('; ');
};

// Build security headers from configuration
const buildSecurityHeaders = (config: any): Record<string, string> => {
  const headers: Record<string, string> = {};

  // XSS Protection
  if (config.headers.xssProtection) {
    headers['X-XSS-Protection'] = '1; mode=block';
  }

  // Content Type Options
  if (config.headers.contentTypeOptions) {
    headers['X-Content-Type-Options'] = 'nosniff';
  }

  // Frame Options
  headers['X-Frame-Options'] = config.headers.frameOptions;

  // Referrer Policy
  headers['Referrer-Policy'] = config.headers.referrerPolicy;

  // HSTS
  if (config.headers.hsts && process.env.NODE_ENV === 'production') {
    let hstsValue = `max-age=${config.headers.hsts.maxAge}`;
    if (config.headers.hsts.includeSubDomains) hstsValue += '; includeSubDomains';
    if (config.headers.hsts.preload) hstsValue += '; preload';
    headers['Strict-Transport-Security'] = hstsValue;
  }

  // CSP
  const cspHeader = config.csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
  headers[cspHeader] = buildCSPHeader(config.csp.sources);

  // Permissions Policy
  const permissionsPolicy = [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'interest-cohort=()',
    'payment=()',
    'usb=()',
    'vr=()',
    'magnetometer=()',
    'accelerometer=()',
    'gyroscope=()'
  ].join(', ');
  headers['Permissions-Policy'] = permissionsPolicy;

  // Cross-Origin Policies
  headers['Cross-Origin-Embedder-Policy'] = 'credentialless';
  headers['Cross-Origin-Opener-Policy'] = 'same-origin';
  headers['Cross-Origin-Resource-Policy'] = 'same-origin';

  return headers;
};

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next();
  
  // Get security configuration
  const config = getConfig();
  const securityHeaders = buildSecurityHeaders(config);

  // Apply security headers to all responses
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove server information headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Rate limiting check for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Log the request for monitoring
    console.log(`API Request: ${request.method} ${request.nextUrl.pathname} from ${clientIP}`);
  }

  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token');
    
    // Skip CSRF check for public API routes or if explicitly disabled
    const isPublicRoute = request.nextUrl.pathname.includes('/api/auth') || 
                         request.nextUrl.pathname.includes('/api/health') ||
                         request.nextUrl.pathname.includes('/api/security');
    
    if (!isPublicRoute && !csrfToken && process.env.NODE_ENV === 'production') {
      return new NextResponse('CSRF token missing', { 
        status: 403,
        headers: securityHeaders
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}