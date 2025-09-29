/**
 * Error Reporting System
 * Comprehensive error tracking and reporting for TS Kulis
 */

interface ErrorReport {
  id: string;
  timestamp: number;
  type: 'javascript' | 'promise' | 'network' | 'api' | 'custom' | 'react';
  message: string;
  stack?: string | undefined;
  url: string;
  userAgent: string;
  userId?: string | undefined;
  sessionId?: string | undefined;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: {
    component?: string | undefined;
    action?: string | undefined;
    props?: Record<string, any> | undefined;
    state?: Record<string, any> | undefined;
    additional?: Record<string, any> | undefined;
  } | undefined;
  fingerprint: string;
  count: number;
  resolved: boolean;
  tags: string[];
  breadcrumbs: ErrorBreadcrumb[];
}

interface ErrorBreadcrumb {
  timestamp: number;
  type: 'navigation' | 'click' | 'console' | 'http' | 'user' | 'error';
  category: string;
  message: string;
  data?: Record<string, any> | undefined;
  level: 'info' | 'warning' | 'error' | 'debug';
}

interface ErrorStats {
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
  mostCommon: Array<{
    fingerprint: string;
    message: string;
    count: number;
  }>;
  recentErrors: ErrorReport[];
}

export class ErrorReportingSystem {
  private errors: ErrorReport[] = [];
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private maxBreadcrumbs: number = 50;
  private maxErrors: number = 100;
  private reportEndpoint: string;
  private isEnabled: boolean = true;
  private userId?: string | undefined;
  private sessionId?: string | undefined;

  constructor(options: {
    reportEndpoint?: string | undefined;
    maxBreadcrumbs?: number | undefined;
    maxErrors?: number | undefined;
    userId?: string | undefined;
    sessionId?: string | undefined;
  } = {}) {
    this.reportEndpoint = options.reportEndpoint || '/api/monitoring/errors';
    this.maxBreadcrumbs = options.maxBreadcrumbs || 50;
    this.maxErrors = options.maxErrors || 100;
    this.userId = options.userId;
    this.sessionId = options.sessionId;

    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.captureError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        severity: 'high',
        context: {
          additional: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        type: 'promise',
        message: event.reason?.toString() || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        severity: 'high',
        context: {
          additional: {
            reason: event.reason
          }
        }
      });
    });

    // Network errors
    this.interceptNetworkErrors();

    // Console errors
    this.interceptConsoleErrors();

    console.log('[ErrorReporting] Initialized');
  }

  private interceptNetworkErrors() {
    // Fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      try {
        const response = await originalFetch(input, init);
        
        if (!response.ok) {
          this.captureError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            severity: response.status >= 500 ? 'high' : 'medium',
            context: {
              additional: {
                url: typeof input === 'string' ? input : (input as Request).url || input.toString(),
                status: response.status,
                statusText: response.statusText,
                method: init?.method || 'GET'
              }
            }
          });
        }

        return response;
      } catch (error: any) {
        this.captureError({
          type: 'network',
          message: error?.message || 'Network request failed',
          stack: error?.stack,
          severity: 'high',
          context: {
            additional: {
              url: typeof input === 'string' ? input : (input as Request).url || input.toString(),
              method: init?.method || 'GET'
            }
          }
        });
        throw error;
      }
    };

    // XMLHttpRequest errors
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, async?: boolean, username?: string | null, password?: string | null) {
      (this as any)._method = method;
      (this as any)._url = url;
      return originalXHROpen.call(this, method, url, async !== undefined ? async : true, username, password);
    };

    XMLHttpRequest.prototype.send = function(data) {
      this.addEventListener('error', () => {
        errorReporting.captureError({
          type: 'network',
          message: `XHR Error: ${(this as any)._method} ${(this as any)._url}`,
          severity: 'high',
          context: {
            additional: {
              method: (this as any)._method,
              url: (this as any)._url,
              status: this.status,
              statusText: this.statusText
            }
          }
        });
      });

      this.addEventListener('load', () => {
        if (this.status >= 400) {
          errorReporting.captureError({
            type: 'network',
            message: `XHR ${this.status}: ${this.statusText}`,
            severity: this.status >= 500 ? 'high' : 'medium',
            context: {
              additional: {
                method: (this as any)._method,
                url: (this as any)._url,
                status: this.status,
                statusText: this.statusText
              }
            }
          });
        }
      });

      return originalXHRSend.call(this, data);
    };
  }

  private interceptConsoleErrors() {
    const originalConsoleError = console.error;
    
    console.error = (...args) => {
      // Add breadcrumb
      this.addBreadcrumb({
        type: 'console',
        category: 'console.error',
        message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '),
        level: 'error'
      });

      // Call original console.error
      originalConsoleError.apply(console, args);
    };

    const originalConsoleWarn = console.warn;
    
    console.warn = (...args) => {
      this.addBreadcrumb({
        type: 'console',
        category: 'console.warn',
        message: args.map(arg => typeof arg === 'string' ? arg : JSON.stringify(arg)).join(' '),
        level: 'warning'
      });

      originalConsoleWarn.apply(console, args);
    };
  }

  public captureError(error: {
    type?: ErrorReport['type'];
    message: string;
    stack?: string | undefined;
    severity?: ErrorReport['severity'];
    context?: ErrorReport['context'];
    tags?: string[];
  }) {
    if (!this.isEnabled) return;

    const fingerprint = this.generateFingerprint(error.message, error.stack);
    const existingError = this.errors.find(e => e.fingerprint === fingerprint);

    if (existingError) {
      existingError.count++;
      existingError.timestamp = Date.now();
      existingError.breadcrumbs = [...this.breadcrumbs];
    } else {
      const errorReport: ErrorReport = {
        id: this.generateId('error'),
        timestamp: Date.now(),
        type: error.type || 'custom',
        message: error.message,
        stack: error.stack || undefined,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: this.userId,
        sessionId: this.sessionId,
        severity: error.severity || 'medium',
        context: error.context || undefined,
        fingerprint,
        count: 1,
        resolved: false,
        tags: error.tags || [],
        breadcrumbs: [...this.breadcrumbs]
      };

      this.errors.push(errorReport);

      // Trim old errors
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(-this.maxErrors);
      }

      // Send to server for critical errors
      if (errorReport.severity === 'critical') {
        this.sendErrorReport(errorReport);
      }
    }

    // Add error breadcrumb
    this.addBreadcrumb({
      type: 'error',
      category: error.type || 'error',
      message: error.message,
      level: 'error',
      data: {
        stack: error.stack,
        severity: error.severity
      }
    });

    console.log('[ErrorReporting] Error captured:', error.message);
  }

  public captureException(exception: Error, context?: ErrorReport['context']) {
    this.captureError({
      type: 'javascript',
      message: exception.message,
      stack: exception.stack,
      severity: 'high',
      context,
      tags: ['exception']
    });
  }

  public captureAPIError(response: Response, context?: Record<string, any>) {
    this.captureError({
      type: 'api',
      message: `API Error: ${response.status} ${response.statusText}`,
      severity: response.status >= 500 ? 'critical' : 'high',
      context: {
        additional: {
          url: response.url,
          status: response.status,
          statusText: response.statusText,
          ...context
        }
      },
      tags: ['api', 'http']
    });
  }

  public captureReactError(error: Error, errorInfo: { componentStack: string }) {
    this.captureError({
      type: 'react',
      message: error.message,
      stack: error.stack,
      severity: 'high',
      context: {
        additional: {
          componentStack: errorInfo.componentStack
        }
      },
      tags: ['react', 'component']
    });
  }

  public addBreadcrumb(breadcrumb: {
    type: ErrorBreadcrumb['type'];
    category: string;
    message: string;
    data?: Record<string, any> | undefined;
    level?: ErrorBreadcrumb['level'];
  }) {
    const newBreadcrumb: ErrorBreadcrumb = {
      timestamp: Date.now(),
      type: breadcrumb.type,
      category: breadcrumb.category,
      message: breadcrumb.message,
      data: breadcrumb.data || undefined,
      level: breadcrumb.level || 'info'
    };

    this.breadcrumbs.push(newBreadcrumb);

    // Trim old breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  public addUserBreadcrumb(action: string, data?: Record<string, any>) {
    this.addBreadcrumb({
      type: 'user',
      category: 'user_action',
      message: action,
      data,
      level: 'info'
    });
  }

  public addNavigationBreadcrumb(url: string) {
    this.addBreadcrumb({
      type: 'navigation',
      category: 'navigation',
      message: `Navigated to ${url}`,
      data: { url },
      level: 'info'
    });
  }

  private generateFingerprint(message: string, stack?: string | undefined): string {
    const content = message + (stack || '');
    let hash = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendErrorReport(error: ErrorReport) {
    try {
      const response = await fetch(this.reportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      });

      if (response.ok) {
        console.log('[ErrorReporting] Error report sent successfully');
      }
    } catch (err) {
      console.warn('[ErrorReporting] Failed to send error report:', err);
    }
  }

  public async sendBatchReport() {
    if (this.errors.length === 0) return;

    try {
      const response = await fetch(`${this.reportEndpoint}/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errors: this.errors,
          stats: this.getErrorStats()
        })
      });

      if (response.ok) {
        console.log('[ErrorReporting] Batch report sent successfully');
        // Clear sent errors
        this.errors = [];
      }
    } catch (error) {
      console.warn('[ErrorReporting] Failed to send batch report:', error);
    }
  }

  public getErrorStats(): ErrorStats {
    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    const fingerprints: Record<string, { message: string; count: number }> = {};

    this.errors.forEach(error => {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;
      
      if (!fingerprints[error.fingerprint]) {
        fingerprints[error.fingerprint] = {
          message: error.message,
          count: 0
        };
      }
      const fingerprintData = fingerprints[error.fingerprint];
      if (fingerprintData) {
        fingerprintData.count += error.count;
      }
    });

    const mostCommon = Object.entries(fingerprints)
      .map(([fingerprint, data]) => ({
        fingerprint,
        message: data.message,
        count: data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total: this.errors.length,
      byType,
      bySeverity,
      mostCommon,
      recentErrors: this.errors.slice(-10)
    };
  }

  public getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  public getBreadcrumbs(): ErrorBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  public clearErrors() {
    this.errors = [];
  }

  public clearBreadcrumbs() {
    this.breadcrumbs = [];
  }

  public setContext(context: { userId?: string | undefined; sessionId?: string | undefined }) {
    this.userId = context.userId;
    this.sessionId = context.sessionId;
  }

  public enable() {
    this.isEnabled = true;
  }

  public disable() {
    this.isEnabled = false;
  }

  public isErrorReportingEnabled(): boolean {
    return this.isEnabled;
  }
}

// Global error boundary handler
export class ErrorBoundaryReporter {
  private errorReporting: ErrorReportingSystem;

  constructor(errorReporting: ErrorReportingSystem) {
    this.errorReporting = errorReporting;
  }

  public captureErrorBoundary(error: Error, errorInfo: { componentStack: string }) {
    this.errorReporting.captureReactError(error, errorInfo);
  }
}

// Singleton instance
export const errorReporting = new ErrorReportingSystem();

// Error utilities
export const ErrorUtils = {
  formatError: (error: ErrorReport): string => {
    return `[${error.severity.toUpperCase()}] ${error.type}: ${error.message}`;
  },

  getErrorsByType: (errors: ErrorReport[], type: string): ErrorReport[] => {
    return errors.filter(error => error.type === type);
  },

  getErrorsBySeverity: (errors: ErrorReport[], severity: string): ErrorReport[] => {
    return errors.filter(error => error.severity === severity);
  },

  getRecentErrors: (errors: ErrorReport[], minutes: number = 60): ErrorReport[] => {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    return errors.filter(error => error.timestamp > cutoff);
  },

  groupErrorsByFingerprint: (errors: ErrorReport[]): Record<string, ErrorReport[]> => {
    const groups: Record<string, ErrorReport[]> = {};
    
    errors.forEach(error => {
      if (!groups[error.fingerprint]) {
        groups[error.fingerprint] = [];
      }
      const group = groups[error.fingerprint];
      if (group) {
        group.push(error);
      }
    });
    
    return groups;
  }
};

export default errorReporting;