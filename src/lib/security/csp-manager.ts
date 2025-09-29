/**
 * Content Security Policy (CSP) Management
 * Comprehensive CSP implementation with dynamic policy management
 */

// CSP directive types (remove unused interface)

interface CSPConfig {
  'default-src'?: string[];
  'script-src'?: string[];
  'style-src'?: string[];
  'img-src'?: string[];
  'font-src'?: string[];
  'connect-src'?: string[];
  'frame-src'?: string[];
  'media-src'?: string[];
  'object-src'?: string[];
  'base-uri'?: string[];
  'form-action'?: string[];
  'frame-ancestors'?: string[];
  'upgrade-insecure-requests'?: boolean;
  'block-all-mixed-content'?: boolean;
  'require-trusted-types-for'?: string[];
  'trusted-types'?: string[];
  'report-uri'?: string;
  'report-to'?: string;
}

// Environment-specific CSP policies
const developmentCSP: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-eval'", // For development tools
    "'unsafe-inline'", // For development hot reloading
    'localhost:*',
    '127.0.0.1:*',
    'webpack://*'
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // For styled-components and development
    'fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https:',
    'http:', // Allow HTTP in development
    'localhost:*',
    '127.0.0.1:*'
  ],
  'font-src': [
    "'self'",
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'data:'
  ],
  'connect-src': [
    "'self'",
    'localhost:*',
    '127.0.0.1:*',
    'ws://localhost:*',
    'wss://localhost:*',
    'http://localhost:*',
    'https://localhost:*'
  ],
  'frame-src': ["'none'"],
  'media-src': ["'self'", 'data:', 'blob:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': false, // Allow mixed content in development
  'block-all-mixed-content': false
};

const productionCSP: CSPConfig = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'sha256-YOUR_HASH_HERE'", // Replace with actual script hashes
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com'
  ],
  'style-src': [
    "'self'",
    "'sha256-YOUR_HASH_HERE'", // Replace with actual style hashes
    'https://fonts.googleapis.com'
  ],
  'img-src': [
    "'self'",
    'data:',
    'https:',
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://firebasestorage.googleapis.com' // Firebase images
  ],
  'font-src': [
    "'self'",
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com'
  ],
  'connect-src': [
    "'self'",
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://firebaseapp.com',
    'wss://*.firebase.com'
  ],
  'frame-src': [
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com'
  ],
  'media-src': ["'self'", 'https:'],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': true,
  'block-all-mixed-content': true,
  'report-uri': '/api/security/csp-report'
};

// CSP Builder class
export class CSPBuilder {
  private config: CSPConfig;
  private nonces: Map<string, string> = new Map();
  private hashes: Map<string, string[]> = new Map();

  constructor(environment: 'development' | 'production' | 'test' = 'production') {
    this.config = environment === 'development' ? { ...developmentCSP } : { ...productionCSP };
  }

  // Add a nonce for inline scripts/styles
  addNonce(type: 'script' | 'style'): string {
    const nonce = this.generateNonce();
    this.nonces.set(type, nonce);
    
    // Add nonce to appropriate directive
    const directive = type === 'script' ? 'script-src' : 'style-src';
    if (this.config[directive]) {
      this.config[directive]!.push(`'nonce-${nonce}'`);
    }
    
    return nonce;
  }

  // Add a hash for inline scripts/styles
  addHash(type: 'script' | 'style', content: string): string {
    const hash = this.generateHash(content);
    
    if (!this.hashes.has(type)) {
      this.hashes.set(type, []);
    }
    
    this.hashes.get(type)!.push(hash);
    
    // Add hash to appropriate directive
    const directive = type === 'script' ? 'script-src' : 'style-src';
    if (this.config[directive]) {
      this.config[directive]!.push(`'sha256-${hash}'`);
    }
    
    return hash;
  }

  // Add allowed source to a directive
  addSource(directive: keyof CSPConfig, source: string): void {
    if (typeof this.config[directive] === 'object' && Array.isArray(this.config[directive])) {
      const directiveArray = this.config[directive] as string[];
      if (!directiveArray.includes(source)) {
        directiveArray.push(source);
      }
    }
  }

  // Remove source from a directive
  removeSource(directive: keyof CSPConfig, source: string): void {
    if (typeof this.config[directive] === 'object' && Array.isArray(this.config[directive])) {
      const directiveArray = this.config[directive] as string[];
      const index = directiveArray.indexOf(source);
      if (index > -1) {
        directiveArray.splice(index, 1);
      }
    }
  }

  // Update entire directive
  setDirective(directive: keyof CSPConfig, values: string[] | boolean | string): void {
    (this.config as any)[directive] = values;
  }

  // Get current nonce for a type
  getNonce(type: 'script' | 'style'): string | undefined {
    return this.nonces.get(type);
  }

  // Get current hashes for a type
  getHashes(type: 'script' | 'style'): string[] {
    return this.hashes.get(type) || [];
  }

  // Build CSP header string
  build(): string {
    const directives: string[] = [];

    Object.entries(this.config).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          directives.push(`${key} ${value.join(' ')}`);
        }
      } else if (typeof value === 'boolean' && value) {
        directives.push(key);
      } else if (typeof value === 'string') {
        directives.push(`${key} ${value}`);
      }
    });

    return directives.join('; ');
  }

  // Build report-only CSP header string
  buildReportOnly(): string {
    const reportOnlyConfig = { ...this.config };
    
    // Remove enforcement directives for report-only mode
    delete reportOnlyConfig['upgrade-insecure-requests'];
    delete reportOnlyConfig['block-all-mixed-content'];
    
    const directives: string[] = [];
    
    Object.entries(reportOnlyConfig).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          directives.push(`${key} ${value.join(' ')}`);
        }
      } else if (typeof value === 'string') {
        directives.push(`${key} ${value}`);
      }
    });

    return directives.join('; ');
  }

  // Get configuration object
  getConfig(): CSPConfig {
    return { ...this.config };
  }

  // Generate secure nonce
  private generateNonce(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(16);
      crypto.getRandomValues(array);
      return btoa(String.fromCharCode(...array));
    }
    
    // Fallback for older environments
    return btoa(Math.random().toString(36).substring(2) + Date.now().toString(36));
  }

  // Generate SHA256 hash
  private generateHash(content: string): string {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      // Use Web Crypto API if available
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(content))
        .then(buffer => btoa(String.fromCharCode(...new Uint8Array(buffer))))
        .toString();
    }
    
    // Simple hash fallback (not cryptographically secure)
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return btoa(Math.abs(hash).toString());
  }

  // Clone builder with current configuration
  clone(): CSPBuilder {
    const newBuilder = new CSPBuilder();
    newBuilder.config = { ...this.config };
    newBuilder.nonces = new Map(this.nonces);
    newBuilder.hashes = new Map(this.hashes);
    return newBuilder;
  }

  // Merge with another CSP configuration
  merge(other: CSPConfig): void {
    Object.entries(other).forEach(([key, value]) => {
      const directive = key as keyof CSPConfig;
      
      if (Array.isArray(value) && Array.isArray(this.config[directive])) {
        // Merge arrays and remove duplicates
        const currentArray = this.config[directive] as string[];
        const mergedArray = [...new Set([...currentArray, ...value])];
        (this.config as any)[directive] = mergedArray;
      } else {
        // Overwrite non-array values
        (this.config as any)[directive] = value;
      }
    });
  }
}

// CSP Manager for dynamic policy management
export class CSPManager {
  private builder: CSPBuilder;
  private violations: CSPViolation[] = [];
  private maxViolations: number = 1000;

  constructor(environment: 'development' | 'production' | 'test' = 'production') {
    this.builder = new CSPBuilder(environment);
    this.setupViolationReporting();
  }

  // Get CSP builder
  getBuilder(): CSPBuilder {
    return this.builder;
  }

  // Generate CSP header
  generateHeader(): string {
    return this.builder.build();
  }

  // Generate report-only CSP header
  generateReportOnlyHeader(): string {
    return this.builder.buildReportOnly();
  }

  // Setup CSP violation reporting
  private setupViolationReporting(): void {
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.handleViolation({
          blockedURI: event.blockedURI,
          columnNumber: event.columnNumber,
          disposition: event.disposition,
          documentURI: event.documentURI,
          effectiveDirective: event.effectiveDirective,
          lineNumber: event.lineNumber,
          originalPolicy: event.originalPolicy,
          referrer: event.referrer,
          sample: event.sample,
          sourceFile: event.sourceFile,
          statusCode: event.statusCode,
          violatedDirective: event.violatedDirective,
          timestamp: Date.now()
        });
      });
    }
  }

  // Handle CSP violation
  private handleViolation(violation: CSPViolation): void {
    // Add to violations list
    this.violations.push(violation);
    
    // Keep only recent violations
    if (this.violations.length > this.maxViolations) {
      this.violations.splice(0, this.violations.length - this.maxViolations);
    }

    // Log violation in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('CSP Violation:', violation);
    }

    // Report to analytics/monitoring service
    this.reportViolation(violation);
  }

  // Report violation to external service
  private async reportViolation(violation: CSPViolation): Promise<void> {
    try {
      await fetch('/api/security/csp-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'csp-report': violation
        })
      });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }

  // Get violation statistics
  getViolationStats(): ViolationStats {
    const stats: ViolationStats = {
      total: this.violations.length,
      byDirective: {},
      bySource: {},
      recent: this.violations.slice(-10),
      mostCommon: []
    };

    // Count by directive
    this.violations.forEach(violation => {
      const directive = violation.effectiveDirective || violation.violatedDirective;
      stats.byDirective[directive] = (stats.byDirective[directive] || 0) + 1;
    });

    // Count by source
    this.violations.forEach(violation => {
      const source = violation.blockedURI || 'unknown';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;
    });

    // Find most common violations
    const directiveEntries = Object.entries(stats.byDirective);
    stats.mostCommon = directiveEntries
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([directive, count]) => ({ directive, count }));

    return stats;
  }

  // Clear violation history
  clearViolations(): void {
    this.violations = [];
  }

  // Auto-adjust policy based on violations
  autoAdjustPolicy(options: AutoAdjustOptions = {}): void {
    const { allowTrustedSources = false, maxAdjustments = 10 } = options;
    
    if (!allowTrustedSources) {
      console.warn('Auto-adjustment requires explicit opt-in for security');
      return;
    }

    let adjustmentCount = 0;
    const trustedDomains = ['googleapis.com', 'gstatic.com', 'firebaseapp.com'];

    this.violations.forEach(violation => {
      if (adjustmentCount >= maxAdjustments) return;

      const blockedURI = violation.blockedURI;
      const directive = violation.effectiveDirective || violation.violatedDirective;

      // Only adjust for trusted domains
      if (blockedURI && trustedDomains.some(domain => blockedURI.includes(domain))) {
        try {
          const url = new URL(blockedURI);
          const source = `${url.protocol}//${url.host}`;
          
          this.builder.addSource(directive as keyof CSPConfig, source);
          adjustmentCount++;
          
          console.log(`Auto-adjusted CSP: Added ${source} to ${directive}`);
        } catch (error) {
          console.error('Failed to parse blocked URI:', blockedURI);
        }
      }
    });
  }
}

// CSP Violation interface
interface CSPViolation {
  blockedURI: string;
  columnNumber: number;
  disposition: string;
  documentURI: string;
  effectiveDirective: string;
  lineNumber: number;
  originalPolicy: string;
  referrer: string;
  sample: string;
  sourceFile: string;
  statusCode: number;
  violatedDirective: string;
  timestamp: number;
}

// Violation statistics interface
interface ViolationStats {
  total: number;
  byDirective: Record<string, number>;
  bySource: Record<string, number>;
  recent: CSPViolation[];
  mostCommon: Array<{ directive: string; count: number }>;
}

// Auto-adjustment options
interface AutoAdjustOptions {
  allowTrustedSources?: boolean;
  maxAdjustments?: number;
}

// Utility functions
export const CSPUtils = {
  // Validate CSP directive
  validateDirective(directive: string, values: string[]): boolean {
    const validDirectives = [
      'default-src', 'script-src', 'style-src', 'img-src', 'font-src',
      'connect-src', 'frame-src', 'media-src', 'object-src', 'base-uri',
      'form-action', 'frame-ancestors'
    ];

    if (!validDirectives.includes(directive)) {
      return false;
    }

    // Validate source values
    const validSourcePatterns = [
      /^'self'$/, /^'none'$/, /^'unsafe-inline'$/, /^'unsafe-eval'$/,
      /^'nonce-.+'$/, /^'sha(256|384|512)-.+'$/,
      /^https?:\/\//, /^data:$/, /^blob:$/, /^\*$/
    ];

    return values.every(value => 
      validSourcePatterns.some(pattern => pattern.test(value))
    );
  },

  // Generate nonce attribute
  nonceAttribute(nonce: string): string {
    return `nonce="${nonce}"`;
  },

  // Generate integrity hash for script/style
  generateIntegrity(content: string, algorithm: 'sha256' | 'sha384' | 'sha512' = 'sha384'): string {
    // This is a simplified version - use proper crypto implementation in production
    const hash = btoa(content); // Replace with actual crypto hash
    return `${algorithm}-${hash}`;
  },

  // Check if source matches CSP directive
  matchesSource(source: string, allowedSources: string[]): boolean {
    return allowedSources.some(allowed => {
      if (allowed === "'self'" && source === window.location.origin) return true;
      if (allowed === "'none'") return false;
      if (allowed === "*") return true;
      if (allowed.startsWith('*.')) {
        const domain = allowed.substring(2);
        return source.includes(domain);
      }
      return source === allowed || source.startsWith(allowed);
    });
  }
};

// Global CSP manager instance
export const globalCSPManager = new CSPManager(
  process.env.NODE_ENV as 'development' | 'production'
);

export default CSPBuilder;