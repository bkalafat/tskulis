/**
 * Next.js Middleware for Security
 * Applies security headers and CSRF protection
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers configuration
const SECURITY_HEADERS = {
  // XSS Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Content Type Options
  'X-Content-Type-Options': 'nosniff',
  
  // Frame Options
  'X-Frame-Options': 'DENY',
  
  // Content Security Policy
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' 
      https://www.google-analytics.com 
      https://www.googletagmanager.com
      https://connect.facebook.net
      https://platform.twitter.com;
    style-src 'self' 'unsafe-inline' 
      https://fonts.googleapis.com
      https://cdn.jsdelivr.net;
    font-src 'self' 
      https://fonts.gstatic.com
      https://cdn.jsdelivr.net;
    img-src 'self' data: blob:
      https://*.firebase.com
      https://*.googleusercontent.com
      https://www.google-analytics.com;
    connect-src 'self'
      https://api.tskulis.com
      https://*.firebase.com
      https://www.google-analytics.com;
    frame-src 'self'
      https://www.youtube.com
      https://platform.twitter.com;
    media-src 'self' blob:
      https://*.firebase.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s+/g, ' ').trim(),
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // HTTP Strict Transport Security (only in production)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  }),
  
  // Cross-Origin Policies
  'Cross-Origin-Embedder-Policy': 'credentialless',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

export function middleware(request: NextRequest) {
  // Clone the response
  const response = NextResponse.next();

  // Apply security headers to all responses
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Remove server information headers
  response.headers.delete('X-Powered-By');
  response.headers.delete('Server');

  // Rate limiting check for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const clientIP = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
    
    // Simple rate limiting implementation
    // In production, use Redis or external rate limiting service
    const rateLimitKey = `rate_limit_${clientIP}`;
    
    // For now, log the request for monitoring
    console.log(`API Request: ${request.method} ${request.nextUrl.pathname} from ${clientIP}`);
  }

  // CSRF protection for state-changing requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token');
    
    // Skip CSRF check for public API routes or if explicitly disabled
    const isPublicRoute = request.nextUrl.pathname.includes('/api/auth') || 
                         request.nextUrl.pathname.includes('/api/health');
    
    if (!isPublicRoute && !csrfToken) {
      return new NextResponse('CSRF token missing', { 
        status: 403,
        headers: Object.fromEntries(Object.entries(SECURITY_HEADERS))
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