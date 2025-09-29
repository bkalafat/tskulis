/**
 * Security Configuration for TS Kulis
 * Environment-specific security settings
 */

export interface SecurityConfig {
  csp: {
    environment: 'development' | 'production';
    reportOnly: boolean;
    reportUri?: string;
    sources: {
      defaultSrc: string[];
      scriptSrc: string[];
      styleSrc: string[];
      imgSrc: string[];
      fontSrc: string[];
      connectSrc: string[];
      mediaSrc: string[];
      objectSrc: string[];
      frameSrc: string[];
      workerSrc: string[];
      manifestSrc: string[];
    };
  };
  headers: {
    hsts: {
      maxAge: number;
      includeSubDomains: boolean;
      preload: boolean;
    };
    frameOptions: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
    contentTypeOptions: boolean;
    referrerPolicy: string;
    xssProtection: boolean;
  };
  security: {
    enableVulnerabilityScanning: boolean;
    scanInterval: number;
    reportingEnabled: boolean;
    strictMode: boolean;
  };
}

const developmentConfig: SecurityConfig = {
  csp: {
    environment: 'development',
    reportOnly: true,
    sources: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'", "'unsafe-inline'", 'localhost:*', '127.0.0.1:*'],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'http:'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      connectSrc: ["'self'", 'localhost:*', '127.0.0.1:*', 'ws:', 'wss:'],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:'],
      manifestSrc: ["'self'"]
    }
  },
  headers: {
    hsts: {
      maxAge: 86400, // 1 day in development
      includeSubDomains: false,
      preload: false
    },
    frameOptions: 'SAMEORIGIN',
    contentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    xssProtection: true
  },
  security: {
    enableVulnerabilityScanning: true,
    scanInterval: 3600000, // 1 hour
    reportingEnabled: true,
    strictMode: false
  }
};

const productionConfig: SecurityConfig = {
  csp: {
    environment: 'production',
    reportOnly: false,
    reportUri: '/api/security/csp-report',
    sources: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", process.env.NEXT_PUBLIC_API_PATH || ''],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'firebase.googleapis.com', 'firebasestorage.googleapis.com'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      connectSrc: ["'self'", process.env.NEXT_PUBLIC_API_PATH || '', 'firebase.googleapis.com'],
      mediaSrc: ["'self'", 'firebasestorage.googleapis.com'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      workerSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  headers: {
    hsts: {
      maxAge: 63072000, // 2 years
      includeSubDomains: true,
      preload: true
    },
    frameOptions: 'DENY',
    contentTypeOptions: true,
    referrerPolicy: 'strict-origin-when-cross-origin',
    xssProtection: true
  },
  security: {
    enableVulnerabilityScanning: true,
    scanInterval: 86400000, // 24 hours
    reportingEnabled: true,
    strictMode: true
  }
};

export const getSecurityConfig = (): SecurityConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? developmentConfig : productionConfig;
};

export { developmentConfig, productionConfig };