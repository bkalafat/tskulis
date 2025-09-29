/**
 * Secure Headers Management
 * Comprehensive security headers implementation
 */

export interface SecurityHeaders {
  // Content Security Policy
  'Content-Security-Policy'?: string;
  'Content-Security-Policy-Report-Only'?: string;
  
  // XSS Protection
  'X-Content-Type-Options': 'nosniff';
  'X-Frame-Options': 'DENY' | 'SAMEORIGIN' | string;
  'X-XSS-Protection': '1; mode=block' | '0';
  
  // HTTPS Security
  'Strict-Transport-Security': string;
  'Upgrade-Insecure-Requests': '1';
  
  // Referrer Policy
  'Referrer-Policy': 
    | 'no-referrer'
    | 'no-referrer-when-downgrade'
    | 'origin'
    | 'origin-when-cross-origin'
    | 'same-origin'
    | 'strict-origin'
    | 'strict-origin-when-cross-origin'
    | 'unsafe-url';
    
  // Feature Policy / Permissions Policy
  'Permissions-Policy'?: string;
  
  // Additional Security Headers
  'X-Permitted-Cross-Domain-Policies'?: 'none' | 'master-only';
  'X-DNS-Prefetch-Control'?: 'on' | 'off';
  'Expect-CT'?: string;
  'Cross-Origin-Embedder-Policy'?: 'require-corp' | 'unsafe-none';
  'Cross-Origin-Opener-Policy'?: 'same-origin' | 'same-origin-allow-popups' | 'unsafe-none';
  'Cross-Origin-Resource-Policy'?: 'same-site' | 'same-origin' | 'cross-origin';
}

// Environment-specific header configurations
const developmentHeaders: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', // Allow frames in development for tools
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains', // 1 year
  'Upgrade-Insecure-Requests': '1',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'on',
  'Cross-Origin-Embedder-Policy': 'unsafe-none', // Allow in development
  'Cross-Origin-Opener-Policy': 'unsafe-none',
  'Cross-Origin-Resource-Policy': 'cross-origin'
};

const productionHeaders: SecurityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload', // 2 years with preload
  'Upgrade-Insecure-Requests': '1',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()', // Disable camera
    'microphone=()', // Disable microphone
    'geolocation=()', // Disable geolocation
    'payment=()', // Disable payment
    'usb=()', // Disable USB
    'magnetometer=()', // Disable magnetometer
    'accelerometer=()', // Disable accelerometer
    'gyroscope=()', // Disable gyroscope
    'fullscreen=(self)', // Allow fullscreen on same origin
    'autoplay=(self)' // Allow autoplay on same origin
  ].join(', '),
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-DNS-Prefetch-Control': 'off', // Disable DNS prefetching for privacy
  'Expect-CT': 'max-age=86400, enforce',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// Secure Headers Manager
export class SecureHeadersManager {
  private headers: SecurityHeaders;
  private environment: 'development' | 'production' | 'test';

  constructor(environment: 'development' | 'production' | 'test' = 'production') {
    this.environment = environment;
    this.headers = environment === 'development' 
      ? { ...developmentHeaders } 
      : { ...productionHeaders };
  }

  // Set a security header
  setHeader(name: keyof SecurityHeaders, value: string): void {
    (this.headers as any)[name] = value;
  }

  // Get a security header
  getHeader(name: keyof SecurityHeaders): string | undefined {
    return this.headers[name];
  }

  // Remove a security header
  removeHeader(name: keyof SecurityHeaders): void {
    delete this.headers[name];
  }

  // Get all headers as object
  getHeaders(): SecurityHeaders {
    return { ...this.headers };
  }

  // Get headers formatted for HTTP response
  getHTTPHeaders(): Record<string, string> {
    const httpHeaders: Record<string, string> = {};
    
    Object.entries(this.headers).forEach(([name, value]) => {
      if (value !== undefined) {
        httpHeaders[name] = value;
      }
    });
    
    return httpHeaders;
  }

  // Configure HSTS (HTTP Strict Transport Security)
  configureHSTS(options: {
    maxAge: number;
    includeSubDomains?: boolean;
    preload?: boolean;
  }): void {
    let hstsValue = `max-age=${options.maxAge}`;
    
    if (options.includeSubDomains) {
      hstsValue += '; includeSubDomains';
    }
    
    if (options.preload) {
      hstsValue += '; preload';
    }
    
    this.setHeader('Strict-Transport-Security', hstsValue);
  }

  // Configure Permissions Policy
  configurePermissionsPolicy(permissions: Record<string, string[]>): void {
    const policies = Object.entries(permissions).map(([feature, origins]) => {
      const originList = origins.length > 0 ? `(${origins.join(' ')})` : '()';
      return `${feature}=${originList}`;
    });
    
    this.setHeader('Permissions-Policy', policies.join(', '));
  }

  // Configure Expect-CT
  configureExpectCT(options: {
    maxAge: number;
    enforce?: boolean;
    reportUri?: string;
  }): void {
    let expectCTValue = `max-age=${options.maxAge}`;
    
    if (options.enforce) {
      expectCTValue += ', enforce';
    }
    
    if (options.reportUri) {
      expectCTValue += `, report-uri="${options.reportUri}"`;
    }
    
    this.setHeader('Expect-CT', expectCTValue);
  }

  // Apply headers to HTTP response (Next.js compatible)
  applyToResponse(res: any): void {
    const httpHeaders = this.getHTTPHeaders();
    
    Object.entries(httpHeaders).forEach(([name, value]) => {
      res.setHeader(name, value);
    });
  }

  // Generate next.config.js headers configuration
  generateNextJSConfig(): any[] {
    const httpHeaders = this.getHTTPHeaders();
    
    return [
      {
        source: '/(.*)',
        headers: Object.entries(httpHeaders).map(([key, value]) => ({
          key,
          value
        }))
      }
    ];
  }

  // Validate headers configuration
  validateHeaders(): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check HSTS
    const hsts = this.getHeader('Strict-Transport-Security');
    if (!hsts) {
      errors.push('Missing Strict-Transport-Security header');
    } else {
      const maxAge = hsts.match(/max-age=(\d+)/)?.[1];
      if (!maxAge || parseInt(maxAge) < 31536000) { // 1 year
        warnings.push('HSTS max-age should be at least 1 year (31536000 seconds)');
      }
    }

    // Check CSP
    if (!this.getHeader('Content-Security-Policy') && !this.getHeader('Content-Security-Policy-Report-Only')) {
      warnings.push('Missing Content Security Policy');
    }

    // Check X-Frame-Options vs CSP frame-ancestors
    const frameOptions = this.getHeader('X-Frame-Options');
    const csp = this.getHeader('Content-Security-Policy');
    if (frameOptions && csp && csp.includes('frame-ancestors')) {
      warnings.push('Both X-Frame-Options and CSP frame-ancestors are set. CSP takes precedence.');
    }

    // Check Permissions Policy
    if (!this.getHeader('Permissions-Policy')) {
      warnings.push('Consider adding Permissions Policy for better security');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Security score based on headers
  getSecurityScore(): SecurityScore {
    const headers = this.getHeaders();
    let score = 0;
    let maxScore = 0;
    const details: Array<{ header: string; present: boolean; score: number; maxScore: number }> = [];

    // Define scoring criteria
    const scoringCriteria = [
      { header: 'Strict-Transport-Security', score: 20 },
      { header: 'Content-Security-Policy', score: 25 },
      { header: 'X-Content-Type-Options', score: 10 },
      { header: 'X-Frame-Options', score: 15 },
      { header: 'Referrer-Policy', score: 10 },
      { header: 'Permissions-Policy', score: 15 },
      { header: 'Cross-Origin-Opener-Policy', score: 5 }
    ];

    scoringCriteria.forEach(({ header, score: headerScore }) => {
      const present = !!(headers as any)[header];
      maxScore += headerScore;
      
      if (present) {
        score += headerScore;
      }
      
      details.push({
        header,
        present,
        score: present ? headerScore : 0,
        maxScore: headerScore
      });
    });

    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      grade: this.calculateGrade(score, maxScore),
      details
    };
  }

  // Calculate security grade
  private calculateGrade(score: number, maxScore: number): string {
    const percentage = (score / maxScore) * 100;
    
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  // Clone headers manager
  clone(): SecureHeadersManager {
    const newManager = new SecureHeadersManager(this.environment);
    newManager.headers = { ...this.headers };
    return newManager;
  }

  // Reset to default headers
  reset(): void {
    this.headers = this.environment === 'development' 
      ? { ...developmentHeaders } 
      : { ...productionHeaders };
  }
}

// Interfaces
interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface SecurityScore {
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  details: Array<{
    header: string;
    present: boolean;
    score: number;
    maxScore: number;
  }>;
}

// Utility functions
export const HeaderUtils = {
  // Check if running on HTTPS
  isHTTPS(): boolean {
    return typeof window !== 'undefined' && window.location.protocol === 'https:';
  },

  // Generate secure random string for nonces
  generateNonce(length: number = 16): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      return btoa(String.fromCharCode(...array));
    }
    
    // Fallback for older environments
    return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
  },

  // Parse HSTS header
  parseHSTS(header: string): {
    maxAge: number;
    includeSubDomains: boolean;
    preload: boolean;
  } {
    const maxAgeMatch = header.match(/max-age=(\d+)/);
    const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1]!, 10) : 0;
    const includeSubDomains = header.includes('includeSubDomains');
    const preload = header.includes('preload');
    
    return { maxAge, includeSubDomains, preload };
  },

  // Validate header value format
  validateHeaderValue(header: string, value: string): boolean {
    // Basic validation - extend as needed
    const validations: Record<string, (val: string) => boolean> = {
      'Strict-Transport-Security': (val) => /^max-age=\d+/.test(val),
      'X-Frame-Options': (val) => ['DENY', 'SAMEORIGIN'].includes(val) || val.startsWith('ALLOW-FROM'),
      'X-Content-Type-Options': (val) => val === 'nosniff',
      'Referrer-Policy': (val) => [
        'no-referrer', 'no-referrer-when-downgrade', 'origin',
        'origin-when-cross-origin', 'same-origin', 'strict-origin',
        'strict-origin-when-cross-origin', 'unsafe-url'
      ].includes(val)
    };
    
    const validator = validations[header];
    return validator ? validator(value) : true; // Unknown headers pass validation
  }
};

// Global secure headers manager
export const globalSecureHeaders = new SecureHeadersManager(
  process.env.NODE_ENV as 'development' | 'production'
);

export default SecureHeadersManager;