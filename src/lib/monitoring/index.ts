/**
 * Monitoring and Analytics System
 * Central exports for all monitoring functionality
 */

// Performance monitoring
export {
  PerformanceMonitor
} from './performance';

// User analytics
export {
  UserAnalytics,
  userAnalytics,
  AnalyticsUtils
} from './analytics';

// Error reporting
export {
  ErrorReportingSystem,
  ErrorBoundaryReporter,
  errorReporting,
  ErrorUtils
} from './errors';

// Utility functions
export const MonitoringUtils = {
  /**
   * Initialize all monitoring systems
   */
  initializeAll: (options: {
    performanceEndpoint?: string;
    analyticsEndpoint?: string;
    errorsEndpoint?: string;
    sampleRate?: number;
    userId?: string;
  } = {}) => {
    if (typeof window === 'undefined') {
      console.warn('[Monitoring] Cannot initialize in non-browser environment');
      return null;
    }

    const {
      performanceEndpoint = '/api/monitoring/performance',
      analyticsEndpoint = '/api/monitoring/analytics',
      errorsEndpoint = '/api/monitoring/errors',
      sampleRate = 1,
      userId
    } = options;

    try {
      // Import here to avoid issues with SSR
      const { PerformanceMonitor } = require('./performance');
      const { UserAnalytics } = require('./analytics');
      const { ErrorReportingSystem } = require('./errors');

      // Initialize performance monitoring
      const performanceMonitor = new PerformanceMonitor({
        reportEndpoint: performanceEndpoint,
        sampleRate
      });

      // Initialize analytics
      const analytics = new UserAnalytics({
        reportEndpoint: analyticsEndpoint,
        sampleRate,
        userId
      });

      // Initialize error reporting
      const errorReporting = new ErrorReportingSystem({
        reportEndpoint: errorsEndpoint,
        userId
      });

      // Set up cross-system integration
      errorReporting.setContext({
        userId,
        sessionId: analytics.getSession().id
      });

      console.log('[Monitoring] All systems initialized successfully');

      return {
        performanceMonitor,
        analytics,
        errorReporting
      };
    } catch (error) {
      console.error('[Monitoring] Failed to initialize systems:', error);
      return null;
    }
  },

  /**
   * Create monitoring configuration for production
   */
  createProductionConfig: () => ({
    performanceEndpoint: process.env.NEXT_PUBLIC_MONITORING_PERFORMANCE_ENDPOINT || '/api/monitoring/performance',
    analyticsEndpoint: process.env.NEXT_PUBLIC_MONITORING_ANALYTICS_ENDPOINT || '/api/monitoring/analytics',
    errorsEndpoint: process.env.NEXT_PUBLIC_MONITORING_ERRORS_ENDPOINT || '/api/monitoring/errors',
    sampleRate: parseFloat(process.env.NEXT_PUBLIC_MONITORING_SAMPLE_RATE || '0.1'), // 10% sampling in production
  }),

  /**
   * Create monitoring configuration for development
   */
  createDevelopmentConfig: () => ({
    performanceEndpoint: '/api/monitoring/performance',
    analyticsEndpoint: '/api/monitoring/analytics',
    errorsEndpoint: '/api/monitoring/errors',
    sampleRate: 1, // 100% sampling in development
  }),

  /**
   * Check if monitoring is supported in current environment
   */
  isSupported: (): boolean => {
    if (typeof window === 'undefined') return false;
    
    return !!(
      window.performance &&
      typeof window.fetch === 'function' &&
      window.navigator
    );
  },

  /**
   * Get current environment
   */
  getEnvironment: (): 'development' | 'production' | 'test' => {
    if (typeof process !== 'undefined') {
      if (process.env.NODE_ENV === 'test') return 'test';
      if (process.env.NODE_ENV === 'production') return 'production';
    }
    return 'development';
  }
};

// Default singleton instances for convenience
let defaultMonitoringInstances: ReturnType<typeof MonitoringUtils.initializeAll> | null = null;

export const getDefaultMonitoring = () => {
  if (!defaultMonitoringInstances && typeof window !== 'undefined') {
    const env = MonitoringUtils.getEnvironment();
    const config = env === 'production' 
      ? MonitoringUtils.createProductionConfig()
      : MonitoringUtils.createDevelopmentConfig();
    
    defaultMonitoringInstances = MonitoringUtils.initializeAll(config);
  }
  
  return defaultMonitoringInstances;
};

// Auto-initialize in browser environment
if (typeof window !== 'undefined' && MonitoringUtils.isSupported()) {
  // Initialize with a small delay to allow the page to load
  setTimeout(() => {
    const monitoring = getDefaultMonitoring();
    if (monitoring) {
      console.log('[Monitoring] Auto-initialization completed');
    }
  }, 1000);
}