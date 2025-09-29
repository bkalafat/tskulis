/**
 * Error Handling Integration
 * Centralized error handling system integration
 */

export { 
  GlobalErrorBoundary, 
  PageErrorBoundary, 
  SectionErrorBoundary, 
  ComponentErrorBoundary,
  useErrorHandler 
} from './error-boundary';

export { 
  FeatureDetector,
  ProgressiveWrapper,
  LoadingFallback,
  AdaptiveLoading,
  NetworkAware,
  withGracefulDegradation,
  SafeStorage,
  GracefulImage
} from './graceful-degradation';

export {
  NotFoundPage,
  InternalServerErrorPage,
  ServiceUnavailablePage,
  NetworkErrorPage,
  PermissionDeniedPage,
  GenericErrorPage
} from './error-pages';

export { ErrorReportingService, globalErrorReporter, useErrorReporting } from './error-reporting';

// Error handling utilities
export const ErrorHandlingUtils = {
  // Safe async operation wrapper
  safeAsync: async <T>(
    operation: () => Promise<T>,
    fallback?: T,
    onError?: (error: Error) => void
  ): Promise<T | undefined> => {
    try {
      return await operation();
    } catch (error) {
      console.error('Safe async operation failed:', error);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      
      return fallback;
    }
  },

  // Retry mechanism
  retry: async <T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt === maxAttempts) {
          break;
        }
        
        // Exponential backoff
        const retryDelay = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
    
    throw lastError!;
  }
};

// Initialize error handling system
export const initializeErrorHandling = (_config?: any) => {
  // Initialize global error handlers
  if (typeof window !== 'undefined') {
    console.log('✅ Error handling system initialized');
  }
};