/**
 * Global Error Boundary System
 * Comprehensive error handling with graceful degradation and reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  enableRetry?: boolean;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  level?: 'page' | 'section' | 'component';
  isolate?: boolean;
}

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  retry: () => void;
  canRetry: boolean;
  errorId: string;
  level: 'page' | 'section' | 'component';
}

interface ErrorReport {
  errorId: string;
  message: string;
  stack: string | undefined;
  componentStack: string | undefined;
  timestamp: number;
  url: string;
  userAgent: string;
  userId: string | undefined;
  sessionId: string;
  level: 'page' | 'section' | 'component';
  retryCount: number;
  context: {
    route: string;
    props: any;
    state: any;
  };
  breadcrumbs: ErrorBreadcrumb[];
}

interface ErrorBreadcrumb {
  timestamp: number;
  category: 'navigation' | 'user' | 'http' | 'console' | 'dom';
  message: string;
  level: 'info' | 'warning' | 'error';
  data?: any;
}

// Error tracking and reporting
class ErrorTracker {
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupGlobalErrorHandlers();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupGlobalErrorHandlers() {
    // JavaScript errors
    window.addEventListener('error', (event) => {
      this.addBreadcrumb({
        timestamp: Date.now(),
        category: 'console',
        message: event.message,
        level: 'error',
        data: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addBreadcrumb({
        timestamp: Date.now(),
        category: 'console',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        level: 'error',
        data: { reason: event.reason }
      });
    });

    // Navigation tracking
    if ('navigation' in performance) {
      this.addBreadcrumb({
        timestamp: Date.now(),
        category: 'navigation',
        message: `Page loaded: ${window.location.pathname}`,
        level: 'info'
      });
    }
  }

  addBreadcrumb(breadcrumb: ErrorBreadcrumb) {
    this.breadcrumbs.push(breadcrumb);
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  getBreadcrumbs(): ErrorBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async reportError(errorReport: ErrorReport): Promise<void> {
    try {
      // Send to error reporting service
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorReport),
        keepalive: true
      });

      console.log(`Error reported with ID: ${errorReport.errorId}`);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
      
      // Fallback: store in localStorage for later reporting
      try {
        const storedErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
        storedErrors.push(errorReport);
        
        // Keep only last 10 errors
        if (storedErrors.length > 10) {
          storedErrors.splice(0, storedErrors.length - 10);
        }
        
        localStorage.setItem('error_reports', JSON.stringify(storedErrors));
      } catch (storageError) {
        console.error('Failed to store error report:', storageError);
      }
    }
  }

  // Try to send stored errors when connectivity is restored
  async retryStoredReports(): Promise<void> {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
      
      for (const errorReport of storedErrors) {
        try {
          await this.reportError(errorReport);
        } catch (error) {
          // If still failing, keep in storage
          break;
        }
      }
      
      // Clear successfully reported errors
      localStorage.removeItem('error_reports');
    } catch (error) {
      console.error('Failed to retry stored error reports:', error);
    }
  }
}

// Global error tracker instance
const errorTracker = new ErrorTracker();

// Default error fallback components
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  retry,
  canRetry,
  errorId,
  level
}) => {
  const styles = {
    page: {
      padding: '40px 20px',
      textAlign: 'center' as const,
      minHeight: '400px',
      display: 'flex',
      flexDirection: 'column' as const,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f8f9fa'
    },
    section: {
      padding: '20px',
      border: '1px solid #e74c3c',
      borderRadius: '8px',
      backgroundColor: '#fdf2f2',
      margin: '10px 0'
    },
    component: {
      padding: '10px',
      border: '1px solid #f39c12',
      borderRadius: '4px',
      backgroundColor: '#fef9e7',
      margin: '5px 0'
    }
  };

  const messages = {
    page: {
      title: 'Sayfa Yüklenirken Bir Hata Oluştu',
      description: 'Özür dileriz, sayfayı yüklerken bir sorun yaşandı. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.'
    },
    section: {
      title: 'Bu Bölüm Yüklenemedi',
      description: 'Bu bölümü yüklerken bir sorun yaşandı. Sayfa geri kalanı normal şekilde çalışmaya devam edecek.'
    },
    component: {
      title: 'İçerik Yüklenemedi',
      description: 'Bu içerik şu anda kullanılamıyor.'
    }
  };

  const currentMessage = messages[level];
  const currentStyle = styles[level];

  return (
    <div style={currentStyle}>
      <h3 style={{ color: '#e74c3c', marginBottom: '16px' }}>
        {level === 'page' ? '🚨' : level === 'section' ? '⚠️' : '⚡'} {currentMessage.title}
      </h3>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        {currentMessage.description}
      </p>
      
      {canRetry && (
        <button
          onClick={retry}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            marginBottom: '12px'
          }}
        >
          🔄 Tekrar Dene
        </button>
      )}
      
      {level === 'page' && (
        <button
          onClick={() => window.location.href = '/'}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginLeft: '8px'
          }}
        >
          🏠 Ana Sayfaya Git
        </button>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <details style={{ marginTop: '20px', textAlign: 'left' }}>
          <summary style={{ cursor: 'pointer', color: '#666' }}>
            Hata Detayları (Geliştirme)
          </summary>
          <pre style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '10px', 
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            marginTop: '10px'
          }}>
            <strong>Error ID:</strong> {errorId}{'\n'}
            <strong>Message:</strong> {error.message}{'\n'}
            <strong>Stack:</strong>{'\n'}{error.stack}
          </pre>
        </details>
      )}
    </div>
  );
};

// Main Error Boundary Component
export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId,
      retryCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = this.state.errorId;
    
    // Add to breadcrumbs
    errorTracker.addBreadcrumb({
      timestamp: Date.now(),
      category: 'console',
      message: `React Error Boundary: ${error.message}`,
      level: 'error',
      data: {
        componentStack: errorInfo.componentStack,
        errorBoundary: this.constructor.name
      }
    });

    // Create comprehensive error report
    const errorReport: ErrorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: undefined, // Will be populated if user is authenticated
      sessionId: errorTracker.getSessionId(),
      level: this.props.level || 'component',
      retryCount: this.state.retryCount,
      context: {
        route: window.location.pathname,
        props: this.sanitizeProps(this.props),
        state: this.state
      },
      breadcrumbs: errorTracker.getBreadcrumbs()
    };

    // Report error
    errorTracker.reportError(errorReport);

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, errorId);
    }

    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    
    if (this.state.hasError && prevProps.children !== this.props.children) {
      if (resetOnPropsChange) {
        this.resetError();
      } else if (resetKeys && this.hasResetKeysChanged(prevProps.resetKeys, resetKeys)) {
        this.resetError();
      }
    }
  }

  private hasResetKeysChanged(prevKeys?: Array<string | number>, nextKeys?: Array<string | number>): boolean {
    if (!prevKeys && !nextKeys) return false;
    if (!prevKeys || !nextKeys) return true;
    if (prevKeys.length !== nextKeys.length) return true;
    
    return prevKeys.some((key, index) => key !== nextKeys[index]);
  }

  private sanitizeProps(props: ErrorBoundaryProps): any {
    // Remove sensitive data and functions from props for error reporting
    const sanitized: any = {};
    
    Object.keys(props).forEach(key => {
      const value = (props as any)[key];
      
      if (typeof value === 'function') {
        sanitized[key] = '[Function]';
      } else if (key === 'children') {
        sanitized[key] = '[React Children]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = '[Object]';
      } else {
        sanitized[key] = value;
      }
    });
    
    return sanitized;
  }

  private resetError = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
      retryCount: this.state.retryCount + 1
    });
  };

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) reached for error boundary`);
      return;
    }

    // Add breadcrumb for retry attempt
    errorTracker.addBreadcrumb({
      timestamp: Date.now(),
      category: 'user',
      message: `Error boundary retry attempt ${this.state.retryCount + 1}`,
      level: 'info',
      data: { errorId: this.state.errorId }
    });

    this.resetError();
  };

  render() {
    const { hasError, error, errorInfo, errorId, retryCount } = this.state;
    const { fallback: FallbackComponent, enableRetry = true, maxRetries = 3, level = 'component' } = this.props;

    if (hasError && error) {
      const canRetry = enableRetry && retryCount < maxRetries;
      
      const fallbackProps: ErrorFallbackProps = {
        error,
        errorInfo: errorInfo!,
        retry: this.handleRetry,
        canRetry,
        errorId,
        level
      };

      if (FallbackComponent) {
        return <FallbackComponent {...fallbackProps} />;
      }

      return <DefaultErrorFallback {...fallbackProps} />;
    }

    return this.props.children;
  }
}

// Specialized error boundaries for different levels
export const PageErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <GlobalErrorBoundary {...props} level="page" />
);

export const SectionErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <GlobalErrorBoundary {...props} level="section" />
);

export const ComponentErrorBoundary: React.FC<Omit<ErrorBoundaryProps, 'level'>> = (props) => (
  <GlobalErrorBoundary {...props} level="component" />
);

// Hook for manual error reporting
export const useErrorHandler = () => {
  const reportError = React.useCallback((error: Error, context?: any) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const errorReport: ErrorReport = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: undefined,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: undefined, // Will be populated if user is authenticated
      sessionId: errorTracker.getSessionId(),
      level: 'component',
      retryCount: 0,
      context: {
        route: window.location.pathname,
        props: context || {},
        state: {}
      },
      breadcrumbs: errorTracker.getBreadcrumbs()
    };

    errorTracker.reportError(errorReport);
  }, []);

  const addBreadcrumb = React.useCallback((breadcrumb: Omit<ErrorBreadcrumb, 'timestamp'>) => {
    errorTracker.addBreadcrumb({
      timestamp: Date.now(),
      ...breadcrumb
    });
  }, []);

  return {
    reportError,
    addBreadcrumb
  };
};

// Export error tracker for advanced usage
export { errorTracker };

export default GlobalErrorBoundary;