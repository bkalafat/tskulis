/**
 * Security Integration and Utilities
 * Main exports for the security hardening system
 */

export {
  CSPBuilder,
  CSPManager,
  CSPUtils,
  globalCSPManager
} from './csp-manager';

export {
  SecureHeadersManager,
  HeaderUtils,
  globalSecureHeaders
} from './secure-headers';

export {
  DependencySecurityScanner,
  SecurityUtils,
  globalSecurityScanner
} from './dependency-scanner';

export {
  SecurityTester,
  globalSecurityTester
} from './security-testing';

import { globalCSPManager } from './csp-manager';
import { globalSecureHeaders } from './secure-headers';

// Initialize all security systems
export const initializeSecurity = async () => {
  console.log('🔐 Security hardening system initialized');
  
  // Initialize CSP manager
  const cspManager = globalCSPManager;
  cspManager.getBuilder().addSource('script-src', "'self'");
  
  // Initialize secure headers
  const secureHeaders = globalSecureHeaders;
  secureHeaders.configureHSTS({
    maxAge: 63072000, // 2 years
    includeSubDomains: true,
    preload: true
  });
  
  console.log('✅ Security systems ready');
};

export default initializeSecurity;