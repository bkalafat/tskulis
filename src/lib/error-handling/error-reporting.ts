/**
 * Error Reporting System
 * Comprehensive error reporting and analytics system
 */

import React from 'react';

// Local type definitions (to avoid circular imports)
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
    browserInfo?: any;
    performance?: any;
    [key: string]: any;
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

// Error reporting configuration
interface ErrorReportingConfig {
  apiEndpoint: string;
  apiKey?: string;
  maxRetries: number;
  retryDelay: number;
  batchSize: number;
  flushInterval: number;
  enabledEnvironments: string[];
  enableLocalStorage: boolean;
  enableConsoleReporting: boolean;
  enableAnalytics: boolean;
  userIdProvider?: () => string | undefined;
  contextProvider?: () => Record<string, any>;
  filters: {
    ignoreUrls: RegExp[];
    ignoreMessages: RegExp[];
    ignoreLevels: string[];
  };
}

// Default configuration
const defaultConfig: ErrorReportingConfig = {
  apiEndpoint: '/api/errors/report',
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 10,
  flushInterval: 10000, // 10 seconds
  enabledEnvironments: ['production', 'staging'],
  enableLocalStorage: true,
  enableConsoleReporting: process.env.NODE_ENV === 'development',
  enableAnalytics: true,
  filters: {
    ignoreUrls: [
      /localhost/,
      /127\.0\.0\.1/,
      /chrome-extension/,
      /moz-extension/
    ],
    ignoreMessages: [
      /Script error/,
      /Non-Error promise rejection captured/,
      /ResizeObserver loop limit exceeded/,
      /Loading chunk \d+ failed/
    ],
    ignoreLevels: []
  }
};

// Error analytics and metrics
interface ErrorMetrics {
  totalErrors: number;
  uniqueErrors: number;
  errorsByLevel: Record<string, number>;
  errorsByCategory: Record<string, number>;
  errorsByPage: Record<string, number>;
  errorsByBrowser: Record<string, number>;
  errorsByDevice: Record<string, number>;
  averageSessionLength: number;
  lastReported: number;
}

// Batch error reporting
interface ErrorBatch {
  id: string;
  timestamp: number;
  errors: ErrorReport[];
  retryCount: number;
}

export class ErrorReportingService {
  private config: ErrorReportingConfig;
  private errorQueue: ErrorReport[] = [];
  private batchQueue: ErrorBatch[] = [];
  private metrics: ErrorMetrics;
  private flushTimer: NodeJS.Timeout | null = null;
  private isEnabled: boolean = false;
  private sessionStartTime: number;

  constructor(config: Partial<ErrorReportingConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.sessionStartTime = Date.now();
    this.metrics = this.initializeMetrics();
    this.initialize();
  }

  private initializeMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      uniqueErrors: 0,
      errorsByLevel: {},
      errorsByCategory: {},
      errorsByPage: {},
      errorsByBrowser: {},
      errorsByDevice: {},
      averageSessionLength: 0,
      lastReported: 0
    };
  }

  private initialize() {
    // Check if error reporting is enabled for current environment
    const environment = process.env.NODE_ENV || 'development';
    this.isEnabled = this.config.enabledEnvironments.includes(environment);

    if (!this.isEnabled) {
      if (this.config.enableConsoleReporting) {
        console.log('Error reporting disabled for environment:', environment);
      }
      return;
    }

    // Load stored metrics
    this.loadMetrics();

    // Set up periodic flushing
    this.startFlushTimer();

    // Set up beforeunload handler to flush remaining errors
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flush(true); // Synchronous flush on page unload
      });

      // Set up visibility change handler for background flushing
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }

    if (this.config.enableConsoleReporting) {
      console.log('Error reporting service initialized');
    }
  }

  // Report a single error
  async reportError(error: ErrorReport): Promise<void> {
    if (!this.isEnabled) {
      return;
    }

    // Apply filters
    if (this.shouldIgnoreError(error)) {
      return;
    }

    // Enrich error with additional context
    const enrichedError = await this.enrichError(error);

    // Update metrics
    this.updateMetrics(enrichedError);

    // Add to queue
    this.errorQueue.push(enrichedError);

    // Console reporting for development
    if (this.config.enableConsoleReporting) {
      console.group(`🚨 Error Report: ${enrichedError.errorId}`);
      console.error('Message:', enrichedError.message);
      console.error('Stack:', enrichedError.stack);
      console.error('Context:', enrichedError.context);
      console.error('Breadcrumbs:', enrichedError.breadcrumbs.slice(-5)); // Last 5 breadcrumbs
      console.groupEnd();
    }

    // Flush if queue is full or error is critical
    if (this.errorQueue.length >= this.config.batchSize || enrichedError.level === 'page') {
      await this.flush();
    }
  }

  // Report multiple errors
  async reportErrors(errors: ErrorReport[]): Promise<void> {
    for (const error of errors) {
      await this.reportError(error);
    }
  }

  // Check if error should be ignored based on filters
  private shouldIgnoreError(error: ErrorReport): boolean {
    const { ignoreUrls, ignoreMessages, ignoreLevels } = this.config.filters;

    // Check URL filters
    if (ignoreUrls.some(pattern => pattern.test(error.url))) {
      return true;
    }

    // Check message filters
    if (ignoreMessages.some(pattern => pattern.test(error.message))) {
      return true;
    }

    // Check level filters
    if (ignoreLevels.includes(error.level)) {
      return true;
    }

    return false;
  }

  // Enrich error with additional context
  private async enrichError(error: ErrorReport): Promise<ErrorReport> {
    const enriched: ErrorReport = { ...error };

    // Add user ID if provider is available
    if (this.config.userIdProvider) {
      enriched.userId = this.config.userIdProvider();
    }

    // Add additional context
    if (this.config.contextProvider) {
      enriched.context = {
        ...enriched.context,
        ...this.config.contextProvider()
      };
    }

    // Add browser and device information
    if (typeof window !== 'undefined') {
      enriched.context.browserInfo = {
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
    }

    // Add performance information if available
    if (typeof performance !== 'undefined') {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (perfData) {
        enriched.context.performance = {
          domContentLoadedTime: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadTime: perfData.loadEventEnd - perfData.loadEventStart,
          connectionType: (navigator as any).connection?.effectiveType
        };
      }
    }

    return enriched;
  }

  // Update error metrics
  private updateMetrics(error: ErrorReport) {
    this.metrics.totalErrors++;
    this.metrics.lastReported = Date.now();

    // Update by level
    this.metrics.errorsByLevel[error.level] = (this.metrics.errorsByLevel[error.level] || 0) + 1;

    // Update by page
    const route = error.context.route || '/';
    this.metrics.errorsByPage[route] = (this.metrics.errorsByPage[route] || 0) + 1;

    // Update by browser
    const userAgent = error.userAgent;
    const browser = this.getBrowserFromUserAgent(userAgent);
    this.metrics.errorsByBrowser[browser] = (this.metrics.errorsByBrowser[browser] || 0) + 1;

    // Update by device
    const device = this.getDeviceFromUserAgent(userAgent);
    this.metrics.errorsByDevice[device] = (this.metrics.errorsByDevice[device] || 0) + 1;

    // Update average session length
    const sessionLength = Date.now() - this.sessionStartTime;
    this.metrics.averageSessionLength = (this.metrics.averageSessionLength + sessionLength) / 2;

    // Save metrics
    this.saveMetrics();
  }

  // Extract browser from user agent
  private getBrowserFromUserAgent(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  // Extract device type from user agent
  private getDeviceFromUserAgent(userAgent: string): string {
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  // Flush error queue
  async flush(synchronous: boolean = false): Promise<void> {
    if (!this.isEnabled || this.errorQueue.length === 0) {
      return;
    }

    // Create batch
    const batch: ErrorBatch = {
      id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      errors: [...this.errorQueue],
      retryCount: 0
    };

    // Clear queue
    this.errorQueue = [];

    // Add to batch queue
    this.batchQueue.push(batch);

    if (synchronous) {
      // Use sendBeacon for synchronous sending during page unload
      await this.sendBatchSync(batch);
    } else {
      // Process batch asynchronously
      await this.processBatch(batch);
    }
  }

  // Process error batch
  private async processBatch(batch: ErrorBatch): Promise<void> {
    try {
      const response = await fetch(this.config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          batchId: batch.id,
          timestamp: batch.timestamp,
          errors: batch.errors
        }),
        keepalive: true
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Remove successful batch from queue
      this.batchQueue = this.batchQueue.filter(b => b.id !== batch.id);

      if (this.config.enableConsoleReporting) {
        console.log(`📤 Error batch sent successfully: ${batch.id} (${batch.errors.length} errors)`);
      }

    } catch (error) {
      console.error('Failed to send error batch:', error);
      
      // Retry logic
      if (batch.retryCount < this.config.maxRetries) {
        batch.retryCount++;
        
        setTimeout(() => {
          this.processBatch(batch);
        }, this.config.retryDelay * batch.retryCount);
        
        if (this.config.enableConsoleReporting) {
          console.warn(`🔄 Retrying error batch: ${batch.id} (attempt ${batch.retryCount})`);
        }
      } else {
        // Max retries reached, store locally if enabled
        if (this.config.enableLocalStorage) {
          this.storeFailedBatch(batch);
        }
        
        // Remove from batch queue
        this.batchQueue = this.batchQueue.filter(b => b.id !== batch.id);
        
        console.error(`❌ Failed to send error batch after ${this.config.maxRetries} retries: ${batch.id}`);
      }
    }
  }

  // Send batch synchronously using sendBeacon
  private async sendBatchSync(batch: ErrorBatch): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.sendBeacon) {
      return;
    }

    const data = JSON.stringify({
      batchId: batch.id,
      timestamp: batch.timestamp,
      errors: batch.errors
    });

    const success = navigator.sendBeacon(this.config.apiEndpoint, data);
    
    if (success) {
      this.batchQueue = this.batchQueue.filter(b => b.id !== batch.id);
    } else if (this.config.enableLocalStorage) {
      this.storeFailedBatch(batch);
    }
  }

  // Store failed batch to localStorage
  private storeFailedBatch(batch: ErrorBatch) {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      const storedBatches = JSON.parse(localStorage.getItem('error_batches') || '[]');
      storedBatches.push(batch);
      
      // Keep only last 5 failed batches
      if (storedBatches.length > 5) {
        storedBatches.splice(0, storedBatches.length - 5);
      }
      
      localStorage.setItem('error_batches', JSON.stringify(storedBatches));
    } catch (error) {
      console.error('Failed to store error batch:', error);
    }
  }

  // Retry stored batches
  async retryStoredBatches(): Promise<void> {
    if (!this.config.enableLocalStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const storedBatches = JSON.parse(localStorage.getItem('error_batches') || '[]');
      
      for (const batch of storedBatches) {
        await this.processBatch(batch);
      }
      
      localStorage.removeItem('error_batches');
    } catch (error) {
      console.error('Failed to retry stored batches:', error);
    }
  }

  // Start flush timer
  private startFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // Stop flush timer
  private stopFlushTimer() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Load metrics from storage
  private loadMetrics() {
    if (!this.config.enableLocalStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      const storedMetrics = localStorage.getItem('error_metrics');
      if (storedMetrics) {
        this.metrics = { ...this.metrics, ...JSON.parse(storedMetrics) };
      }
    } catch (error) {
      console.error('Failed to load error metrics:', error);
    }
  }

  // Save metrics to storage
  private saveMetrics() {
    if (!this.config.enableLocalStorage || typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('error_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save error metrics:', error);
    }
  }

  // Get current metrics
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = this.initializeMetrics();
    this.saveMetrics();
  }

  // Update configuration
  updateConfig(newConfig: Partial<ErrorReportingConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    // Restart with new configuration
    this.stopFlushTimer();
    this.initialize();
  }

  // Destroy service
  destroy() {
    this.stopFlushTimer();
    
    // Flush remaining errors
    this.flush(true);
    
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', () => this.flush(true));
    }
    
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      });
    }
  }
}

// Global error reporting service instance
export const globalErrorReporter = new ErrorReportingService();

// Error reporting hooks for React components
export const useErrorReporting = () => {
  const reportError = React.useCallback((error: Error, context?: any) => {
    const errorReport: ErrorReport = {
      errorId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message,
      stack: error.stack,
      componentStack: undefined,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: undefined,
      sessionId: globalErrorReporter.getMetrics().lastReported.toString(),
      level: 'component',
      retryCount: 0,
      context: {
        route: window.location.pathname,
        props: context || {},
        state: {}
      },
      breadcrumbs: []
    };

    globalErrorReporter.reportError(errorReport);
  }, []);

  const getMetrics = React.useCallback(() => {
    return globalErrorReporter.getMetrics();
  }, []);

  return {
    reportError,
    getMetrics
  };
};

export default ErrorReportingService;