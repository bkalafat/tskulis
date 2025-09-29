/**
 * Performance Monitoring System
 * Comprehensive performance tracking and optimization insights
 */

interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  
  // Custom Metrics
  domContentLoaded?: number;
  windowLoaded?: number;
  firstPaint?: number;
  navigationStart?: number;
  
  // Resource Metrics
  totalResourceSize?: number;
  resourceCount?: number;
  cacheHitRatio?: number;
  
  // JavaScript Metrics
  jsHeapSizeUsed?: number;
  jsHeapSizeTotal?: number;
  jsExecutionTime?: number;
  
  // Network Metrics
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  
  // User Experience Metrics
  pageViews?: number;
  uniqueUsers?: number;
  sessionDuration?: number;
  bounceRate?: number;
}

interface PerformanceEntry {
  name: string;
  entryType: string;
  startTime: number;
  duration: number;
  value?: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
}

interface PerformanceReport {
  id: string;
  timestamp: number;
  url: string;
  userAgent: string;
  connection: {
    type: string;
    effectiveType: string;
    downlink: number;
    rtt: number;
  } | null;
  metrics: PerformanceMetrics;
  entries: PerformanceEntry[];
  errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
  }>;
}

export class PerformanceMonitor {
  private isMonitoring: boolean = false;
  private metrics: PerformanceMetrics = {};
  private entries: PerformanceEntry[] = [];
  private errors: Array<{ message: string; stack?: string; timestamp: number }> = [];
  private observers: PerformanceObserver[] = [];
  private reportEndpoint: string;
  private sampleRate: number;

  constructor(options: {
    reportEndpoint?: string;
    sampleRate?: number;
  } = {}) {
    this.reportEndpoint = options.reportEndpoint || '/api/monitoring/performance';
    this.sampleRate = options.sampleRate || 1; // 1 = 100% sampling

    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check if we should monitor (sampling)
    if (Math.random() > this.sampleRate) return;

    this.isMonitoring = true;
    console.log('[Performance] Monitoring initialized');

    // Initialize performance observers
    this.initializeObservers();

    // Track navigation metrics
    this.trackNavigationMetrics();

    // Track resource metrics
    this.trackResourceMetrics();

    // Track JavaScript heap
    this.trackMemoryMetrics();

    // Track connection info
    this.trackConnectionMetrics();

    // Track custom metrics
    this.trackCustomMetrics();

    // Set up periodic reporting
    this.setupPeriodicReporting();

    // Track page visibility changes
    this.trackVisibilityChanges();
  }

  private initializeObservers() {
    try {
      // Largest Contentful Paint
      this.createObserver('largest-contentful-paint', (entries) => {
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.addEntry({
          name: 'LCP',
          entryType: 'largest-contentful-paint',
          startTime: lastEntry.startTime,
          duration: 0,
          value: lastEntry.startTime,
          rating: this.rateLCP(lastEntry.startTime)
        });
      });

      // First Input Delay
      this.createObserver('first-input', (entries) => {
        const firstEntry = entries[0];
        this.metrics.fid = firstEntry.processingStart - firstEntry.startTime;
        this.addEntry({
          name: 'FID',
          entryType: 'first-input',
          startTime: firstEntry.startTime,
          duration: firstEntry.processingStart - firstEntry.startTime,
          value: firstEntry.processingStart - firstEntry.startTime,
          rating: this.rateFID(firstEntry.processingStart - firstEntry.startTime)
        });
      });

      // Cumulative Layout Shift
      this.createObserver('layout-shift', (entries) => {
        let clsValue = 0;
        entries.forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.metrics.cls = clsValue;
        this.addEntry({
          name: 'CLS',
          entryType: 'layout-shift',
          startTime: performance.now(),
          duration: 0,
          value: clsValue,
          rating: this.rateCLS(clsValue)
        });
      });

      // Paint metrics
      this.createObserver('paint', (entries) => {
        entries.forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
          } else if (entry.name === 'first-paint') {
            this.metrics.firstPaint = entry.startTime;
          }
        });
      });

      // Navigation metrics
      this.createObserver('navigation', (entries) => {
        const entry = entries[0];
        this.metrics.ttfb = entry.responseStart - entry.requestStart;
        this.metrics.domContentLoaded = entry.domContentLoadedEventEnd - entry.navigationStart;
        this.metrics.windowLoaded = entry.loadEventEnd - entry.navigationStart;
      });

      // Resource metrics
      this.createObserver('resource', (entries) => {
        this.trackResourceEntries(entries);
      });

    } catch (error) {
      console.warn('[Performance] Observer initialization failed:', error);
    }
  }

  private createObserver(type: string, callback: (entries: any[]) => void) {
    try {
      if (!PerformanceObserver.supportedEntryTypes.includes(type)) {
        console.warn(`[Performance] ${type} not supported`);
        return;
      }

      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });

      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`[Performance] Failed to create ${type} observer:`, error);
    }
  }

  private trackNavigationMetrics() {
    if (!performance.navigation) return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.metrics.navigationStart = navigation.fetchStart;
      this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.metrics.windowLoaded = navigation.loadEventEnd - navigation.fetchStart;
    }
  }

  private trackResourceMetrics() {
    const resources = performance.getEntriesByType('resource');
    
    let totalSize = 0;
    let cacheHits = 0;

    resources.forEach(resource => {
      // Estimate resource size (not always available)
      if ((resource as any).transferSize !== undefined) {
        totalSize += (resource as any).transferSize;
        
        // Cache hit detection
        if ((resource as any).transferSize === 0 && (resource as any).decodedBodySize > 0) {
          cacheHits++;
        }
      }
    });

    this.metrics.totalResourceSize = totalSize;
    this.metrics.resourceCount = resources.length;
    this.metrics.cacheHitRatio = resources.length > 0 ? cacheHits / resources.length : 0;
  }

  private trackResourceEntries(entries: PerformanceResourceTiming[]) {
    entries.forEach(entry => {
      // Track slow resources
      if (entry.duration > 1000) { // > 1 second
        this.addEntry({
          name: `Slow Resource: ${entry.name}`,
          entryType: 'resource',
          startTime: entry.startTime,
          duration: entry.duration,
          rating: 'poor'
        });
      }
    });
  }

  private trackMemoryMetrics() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.jsHeapSizeUsed = memory.usedJSHeapSize;
      this.metrics.jsHeapSizeTotal = memory.totalJSHeapSize;
    }
  }

  private trackConnectionMetrics() {
    const connection = (navigator as any).connection || 
                     (navigator as any).mozConnection || 
                     (navigator as any).webkitConnection;
    
    if (connection) {
      this.metrics.connectionType = connection.type;
      this.metrics.effectiveType = connection.effectiveType;
      this.metrics.downlink = connection.downlink;
      this.metrics.rtt = connection.rtt;
    }
  }

  private trackCustomMetrics() {
    // Track time to interactive (approximate)
    if (document.readyState === 'complete') {
      this.recordCustomMetric('time-to-interactive', performance.now());
    } else {
      window.addEventListener('load', () => {
        setTimeout(() => {
          this.recordCustomMetric('time-to-interactive', performance.now());
        }, 0);
      });
    }

    // Track JavaScript execution time
    this.trackJavaScriptExecutionTime();
  }

  private trackJavaScriptExecutionTime() {
    let totalScriptTime = 0;
    
    const scriptEntries = performance.getEntriesByType('resource').filter(
      entry => entry.name.endsWith('.js')
    );
    
    scriptEntries.forEach(entry => {
      totalScriptTime += entry.duration;
    });
    
    this.metrics.jsExecutionTime = totalScriptTime;
  }

  private setupPeriodicReporting() {
    // Report metrics after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.reportMetrics();
      }, 5000); // Wait 5 seconds after load
    });

    // Report on page unload
    window.addEventListener('beforeunload', () => {
      this.reportMetrics(true); // Force immediate report
    });

    // Periodic reporting every 30 seconds
    setInterval(() => {
      if (this.isMonitoring) {
        this.reportMetrics();
      }
    }, 30000);
  }

  private trackVisibilityChanges() {
    let startTime = performance.now();
    let totalVisibleTime = 0;

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        startTime = performance.now();
      } else {
        totalVisibleTime += performance.now() - startTime;
        this.metrics.sessionDuration = totalVisibleTime;
      }
    });
  }

  // Public methods
  public recordCustomMetric(name: string, value: number, rating?: 'good' | 'needs-improvement' | 'poor') {
    this.addEntry({
      name: `Custom: ${name}`,
      entryType: 'measure',
      startTime: performance.now(),
      duration: 0,
      value,
      rating: rating || 'good'
    });
  }

  public recordError(error: Error) {
    this.errors.push({
      message: error.message,
      stack: error.stack || undefined,
      timestamp: Date.now()
    });
  }

  public markFeatureUsage(feature: string) {
    this.addEntry({
      name: `Feature: ${feature}`,
      entryType: 'mark',
      startTime: performance.now(),
      duration: 0
    });
  }

  public startTiming(name: string) {
    performance.mark(`${name}-start`);
  }

  public endTiming(name: string) {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const measure = performance.getEntriesByName(name, 'measure')[0];
    if (measure) {
      this.addEntry({
        name: `Timing: ${name}`,
        entryType: 'measure',
        startTime: measure.startTime,
        duration: measure.duration,
        rating: measure.duration < 100 ? 'good' : measure.duration < 300 ? 'needs-improvement' : 'poor'
      });
    }
  }

  private addEntry(entry: PerformanceEntry) {
    this.entries.push(entry);
    
    // Limit entries to prevent memory issues
    if (this.entries.length > 1000) {
      this.entries.splice(0, 500); // Remove oldest 500 entries
    }
  }

  private async reportMetrics(force: boolean = false) {
    if (!this.isMonitoring && !force) return;

    const report: PerformanceReport = {
      id: this.generateReportId(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      metrics: { ...this.metrics },
      entries: [...this.entries],
      errors: [...this.errors]
    };

    try {
      // Use sendBeacon for reliability, fallback to fetch
      const data = JSON.stringify(report);
      
      if (force && navigator.sendBeacon) {
        navigator.sendBeacon(this.reportEndpoint, data);
      } else {
        await fetch(this.reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        });
      }
      
      console.log('[Performance] Metrics reported successfully');
      
      // Clear reported data
      this.entries = [];
      this.errors = [];
      
    } catch (error) {
      console.error('[Performance] Failed to report metrics:', error);
    }
  }

  private getConnectionInfo() {
    const connection = (navigator as any).connection;
    if (!connection) return null;
    
    return {
      type: connection.type || 'unknown',
      effectiveType: connection.effectiveType || '4g',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0
    };
  }

  private generateReportId(): string {
    return `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Rating functions based on Core Web Vitals thresholds
  private rateLCP(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 2500) return 'good';
    if (value <= 4000) return 'needs-improvement';
    return 'poor';
  }

  private rateFID(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 100) return 'good';
    if (value <= 300) return 'needs-improvement';
    return 'poor';
  }

  private rateCLS(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  // Getters
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getEntries(): PerformanceEntry[] {
    return [...this.entries];
  }

  public getCoreWebVitals() {
    return {
      lcp: this.metrics.lcp,
      fid: this.metrics.fid,
      cls: this.metrics.cls,
      ratings: {
        lcp: this.metrics.lcp ? this.rateLCP(this.metrics.lcp) : null,
        fid: this.metrics.fid ? this.rateFID(this.metrics.fid) : null,
        cls: this.metrics.cls ? this.rateCLS(this.metrics.cls) : null
      }
    };
  }

  public stop() {
    this.isMonitoring = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    console.log('[Performance] Monitoring stopped');
  }

  public getReport(): PerformanceReport {
    return {
      id: this.generateReportId(),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connection: this.getConnectionInfo(),
      metrics: { ...this.metrics },
      entries: [...this.entries],
      errors: [...this.errors]
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Performance utilities
export const PerformanceUtils = {
  formatMetric: (value: number | undefined, unit: string = 'ms'): string => {
    if (value === undefined) return 'N/A';
    return `${Math.round(value * 100) / 100}${unit}`;
  },

  formatBytes: (bytes: number | undefined): string => {
    if (!bytes) return 'N/A';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  },

  getRatingColor: (rating: string): string => {
    switch (rating) {
      case 'good': return '#0CCE6B';
      case 'needs-improvement': return '#FFA400'; 
      case 'poor': return '#FF4E42';
      default: return '#9CA3AF';
    }
  },

  getScoreFromMetrics: (metrics: PerformanceMetrics): number => {
    let score = 100;
    
    // Deduct points for poor metrics
    if (metrics.lcp && metrics.lcp > 4000) score -= 30;
    else if (metrics.lcp && metrics.lcp > 2500) score -= 15;
    
    if (metrics.fid && metrics.fid > 300) score -= 20;
    else if (metrics.fid && metrics.fid > 100) score -= 10;
    
    if (metrics.cls && metrics.cls > 0.25) score -= 25;
    else if (metrics.cls && metrics.cls > 0.1) score -= 12;
    
    if (metrics.ttfb && metrics.ttfb > 600) score -= 15;
    
    return Math.max(0, score);
  }
};

export default performanceMonitor;