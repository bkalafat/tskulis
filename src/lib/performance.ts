/**
 * Performance Monitoring Library for TS Kulis
 * Real User Monitoring (RUM) with Core Web Vitals tracking
 */

import { 
  onCLS, 
  onFCP, 
  onINP, 
  onLCP, 
  onTTFB,
  CLSThresholds,
  FCPThresholds,
  INPThresholds,
  LCPThresholds,
  TTFBThresholds
} from 'web-vitals';

// Web Vitals metric interface
export interface Metric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
}

// Performance thresholds based on Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  CLS: CLSThresholds,
  FCP: FCPThresholds,
  INP: INPThresholds,
  LCP: LCPThresholds,
  TTFB: TTFBThresholds,
} as const;

// Performance data interface
export interface PerformanceEntry {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  url: string;
  timestamp: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  connectionType: string;
}

// Performance monitoring configuration
export interface PerformanceConfig {
  endpoint?: string;
  sampleRate?: number;
  debug?: boolean;
  enableAnalytics?: boolean;
  enableRUM?: boolean;
}

class PerformanceMonitor {
  private config: PerformanceConfig;
  private buffer: PerformanceEntry[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config: PerformanceConfig = {}) {
    this.config = {
      endpoint: '/api/performance',
      sampleRate: 1.0,
      debug: false,
      enableAnalytics: true,
      enableRUM: true,
      ...config,
    };
  }

  // Initialize Core Web Vitals tracking
  public init(): void {
    if (!this.config.enableRUM) return;

    // Sample traffic based on config
    if (Math.random() > this.config.sampleRate) return;

    // Track Core Web Vitals
    onCLS(this.handleMetric.bind(this));
    onFCP(this.handleMetric.bind(this));
    onINP(this.handleMetric.bind(this));
    onLCP(this.handleMetric.bind(this));
    onTTFB(this.handleMetric.bind(this));

    // Track page visibility changes
    this.trackPageVisibility();

    // Track navigation timing
    this.trackNavigationTiming();

    // Flush buffer on page unload
    this.setupUnloadHandler();
  }

  // Handle Web Vital metrics
  private handleMetric(metric: Metric): void {
    const entry: PerformanceEntry = {
      id: metric.id,
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      delta: metric.delta,
      url: window.location.pathname,
      timestamp: Date.now(),
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
    };

    this.addEntry(entry);

    if (this.config.debug) {
      console.log(`[Performance] ${metric.name}:`, entry);
    }
  }

  // Add performance entry to buffer
  private addEntry(entry: PerformanceEntry): void {
    this.buffer.push(entry);

    // Auto-flush buffer when it reaches threshold
    if (this.buffer.length >= 10) {
      this.flush();
    } else if (!this.flushTimer) {
      // Schedule flush in 30 seconds
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, 30000);
    }
  }

  // Get performance rating
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (!thresholds) return 'good';

    // Web vitals threshold arrays: [good, needs-improvement]
    if (value <= thresholds[0]) return 'good';
    if (value <= thresholds[1]) return 'needs-improvement';
    return 'poor';
  }

  // Get device type
  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  // Get connection type
  private getConnectionType(): string {
    const nav = navigator as any;
    if (nav.connection) {
      return nav.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  // Track page visibility changes
  private trackPageVisibility(): void {
    let visibilityStart = Date.now();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const visibleTime = Date.now() - visibilityStart;
        this.addEntry({
          id: `visibility-${Date.now()}`,
          name: 'visibility-duration',
          value: visibleTime,
          rating: 'good',
          delta: visibleTime,
          url: window.location.pathname,
          timestamp: Date.now(),
          deviceType: this.getDeviceType(),
          connectionType: this.getConnectionType(),
        });
      } else {
        visibilityStart = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  // Track navigation timing
  private trackNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const timings = {
            'dns-lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
            'tcp-handshake': navigation.connectEnd - navigation.connectStart,
            'request-response': navigation.responseEnd - navigation.requestStart,
            'dom-parse': navigation.domContentLoadedEventEnd - navigation.responseEnd,
            'resource-load': navigation.loadEventEnd - navigation.domContentLoadedEventEnd,
          };

          Object.entries(timings).forEach(([name, value]) => {
            if (value > 0) {
              this.addEntry({
                id: `${name}-${Date.now()}`,
                name,
                value,
                rating: value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor',
                delta: value,
                url: window.location.pathname,
                timestamp: Date.now(),
                deviceType: this.getDeviceType(),
                connectionType: this.getConnectionType(),
              });
            }
          });
        }
      }, 0);
    });
  }

  // Setup unload handler for final flush
  private setupUnloadHandler(): void {
    const flushOnUnload = () => {
      if (this.buffer.length > 0) {
        this.flush(true);
      }
    };

    // Use modern API if available
    if ('sendBeacon' in navigator) {
      window.addEventListener('beforeunload', flushOnUnload);
    } else {
      window.addEventListener('unload', flushOnUnload);
    }
  }

  // Flush buffer to server
  private flush(isUnload = false): void {
    if (this.buffer.length === 0) return;

    const data = [...this.buffer];
    this.buffer = [];

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    const payload = {
      entries: data,
      timestamp: Date.now(),
      url: window.location.pathname,
      userAgent: navigator.userAgent,
    };

    if (isUnload && 'sendBeacon' in navigator) {
      // Use sendBeacon for reliable unload sending
      navigator.sendBeacon(this.config.endpoint!, JSON.stringify(payload));
    } else {
      // Regular fetch for normal flushes
      fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }).catch(error => {
        if (this.config.debug) {
          console.warn('[Performance] Failed to send metrics:', error);
        }
        // Re-add to buffer on failure (unless unloading)
        if (!isUnload) {
          this.buffer.unshift(...data);
        }
      });
    }

    if (this.config.debug) {
      console.log(`[Performance] Flushed ${data.length} metrics`);
    }
  }

  // Manual metric recording
  public recordMetric(name: string, value: number, additionalData: Partial<PerformanceEntry> = {}): void {
    this.addEntry({
      id: `custom-${name}-${Date.now()}`,
      name,
      value,
      rating: 'good',
      delta: value,
      url: window.location.pathname,
      timestamp: Date.now(),
      deviceType: this.getDeviceType(),
      connectionType: this.getConnectionType(),
      ...additionalData,
    });
  }

  // Get current performance summary
  public getSummary(): { [key: string]: PerformanceEntry[] } {
    return this.buffer.reduce((acc, entry) => {
      if (!acc[entry.name]) acc[entry.name] = [];
      acc[entry.name].push(entry);
      return acc;
    }, {} as { [key: string]: PerformanceEntry[] });
  }
}

// Global performance monitor instance
let performanceMonitor: PerformanceMonitor | null = null;

// Initialize performance monitoring
export function initPerformanceMonitoring(config?: PerformanceConfig): void {
  if (typeof window === 'undefined') return;

  performanceMonitor = new PerformanceMonitor(config);
  performanceMonitor.init();
}

// Get performance monitor instance
export function getPerformanceMonitor(): PerformanceMonitor | null {
  return performanceMonitor;
}

// Record custom metric
export function recordCustomMetric(name: string, value: number, additionalData?: Partial<PerformanceEntry>): void {
  performanceMonitor?.recordMetric(name, value, additionalData);
}

// Performance budget checker
export function checkPerformanceBudget(metrics: { [key: string]: number }): {
  passed: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  Object.entries(metrics).forEach(([name, value]) => {
    const threshold = PERFORMANCE_THRESHOLDS[name as keyof typeof PERFORMANCE_THRESHOLDS];
    if (threshold && value > threshold[1]) { // threshold[1] is needs-improvement boundary
      violations.push(`${name}: ${value}ms exceeds threshold of ${threshold[1]}ms`);
    }
  });

  return {
    passed: violations.length === 0,
    violations,
  };
}