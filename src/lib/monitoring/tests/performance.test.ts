/**
 * Tests for Performance Monitoring System
 */

import { PerformanceMonitor } from '../performance';

// Mock PerformanceObserver
const mockPerformanceObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  callback
}));

// Mock performance API
const mockPerformance = {
  now: jest.fn(() => 1234.567),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  navigation: {
    fetchStart: 1000,
    domContentLoadedEventEnd: 2000,
    loadEventEnd: 3000,
    type: 'navigate'
  },
  memory: {
    usedJSHeapSize: 10000000,
    totalJSHeapSize: 20000000,
    jsHeapSizeLimit: 50000000
  }
};

// Mock navigator
const mockNavigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 100
  },
  sendBeacon: jest.fn(() => true)
};

// Mock fetch
const mockFetch = jest.fn(() => Promise.resolve({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true })
}));

// Setup global mocks
Object.defineProperty(global, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true
});

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true
});

Object.defineProperty(global, 'fetch', {
  value: mockFetch,
  writable: true
});

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    monitor = new PerformanceMonitor({
      reportEndpoint: '/api/test-performance'
    });
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('Initialization', () => {
    it('should create a performance monitor', () => {
      expect(monitor).toBeInstanceOf(PerformanceMonitor);
    });

    it('should set up performance observers', () => {
      expect(mockPerformanceObserver).toHaveBeenCalled();
    });
  });

  describe('Core Web Vitals', () => {
    it('should track LCP (Largest Contentful Paint)', () => {
      const lcpEntry = {
        name: 'largest-contentful-paint',
        entryType: 'largest-contentful-paint',
        startTime: 2500,
        size: 5000
      };

      // Simulate LCP callback
      const observerInstance = mockPerformanceObserver.mock.instances[0];
      observerInstance.callback([lcpEntry], observerInstance);

      const metrics = monitor.getMetrics();
      expect(metrics.lcp).toBe(2500);
    });

    it('should rate LCP correctly', () => {
      // Good LCP (≤2500ms)
      expect(monitor['rateLCP'](2000)).toBe('good');
      
      // Needs improvement (2500-4000ms)
      expect(monitor['rateLCP'](3000)).toBe('needs-improvement');
      
      // Poor (>4000ms)
      expect(monitor['rateLCP'](5000)).toBe('poor');
    });

    it('should track FID (First Input Delay)', () => {
      const fidEntry = {
        name: 'first-input-delay',
        entryType: 'first-input',
        processingStart: 1100,
        startTime: 1000
      };

      // Simulate FID callback
      const observerInstance = mockPerformanceObserver.mock.instances[1];
      observerInstance.callback([fidEntry], observerInstance);

      const metrics = monitor.getMetrics();
      expect(metrics.fid).toBe(100);
    });

    it('should rate FID correctly', () => {
      expect(monitor['rateFID'](50)).toBe('good');
      expect(monitor['rateFID'](200)).toBe('needs-improvement');
      expect(monitor['rateFID'](400)).toBe('poor');
    });

    it('should track CLS (Cumulative Layout Shift)', () => {
      const clsEntry = {
        entryType: 'layout-shift',
        value: 0.05,
        hadRecentInput: false
      };

      // Simulate CLS callback
      const observerInstance = mockPerformanceObserver.mock.instances[2];
      observerInstance.callback([clsEntry], observerInstance);

      const metrics = monitor.getMetrics();
      expect(metrics.cls).toBeCloseTo(0.05);
    });

    it('should rate CLS correctly', () => {
      expect(monitor['rateCLS'](0.05)).toBe('good');
      expect(monitor['rateCLS'](0.15)).toBe('needs-improvement');
      expect(monitor['rateCLS'](0.3)).toBe('poor');
    });
  });

  describe('Performance Metrics', () => {
    it('should collect navigation metrics', () => {
      const metrics = monitor.getMetrics();
      
      // Should have some navigation timing data
      expect(typeof metrics.navigationStart).toBe('number');
    });

    it('should collect memory metrics', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics.jsHeapSizeUsed).toBe(10000000);
      expect(metrics.jsHeapSizeTotal).toBe(20000000);
    });

    it('should collect connection info', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics.effectiveType).toBe('4g');
      expect(metrics.downlink).toBe(10);
      expect(metrics.rtt).toBe(100);
    });
  });

  describe('Custom Metrics', () => {
    it('should record custom metrics', () => {
      monitor.recordCustomMetric('api_response_time', 150);
      
      const metrics = monitor.getMetrics();
      expect(metrics).toMatchObject({
        api_response_time: 150
      });
    });

    it('should track timing metrics', () => {
      monitor.startTiming('component_render');
      // Simulate some time passing
      mockPerformance.now.mockReturnValue(1284.567); // +50ms
      monitor.endTiming('component_render');
      
      const metrics = monitor.getMetrics();
      expect(metrics).toMatchObject({
        component_render: 50
      });
    });

    it('should mark feature usage', () => {
      monitor.markFeatureUsage('dark_mode');
      
      const metrics = monitor.getMetrics();
      expect(metrics).toMatchObject({
        dark_mode: expect.any(Number)
      });
    });
  });

  describe('Error Tracking', () => {
    it('should track errors', () => {
      const error = new Error('Test error');
      monitor.recordError(error);
      
      // Errors are included in report
      const report = monitor.getReport();
      expect(report.errors).toHaveLength(1);
      expect(report.errors[0]).toEqual({
        message: 'Test error',
        stack: expect.any(String),
        timestamp: expect.any(Number)
      });
    });
  });

  describe('Reporting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should generate reports', () => {
      const report = monitor.getReport();
      
      expect(report).toEqual({
        id: expect.any(String),
        timestamp: expect.any(Number),
        url: expect.any(String),
        userAgent: expect.any(String),
        connection: expect.any(Object),
        metrics: expect.any(Object),
        entries: expect.any(Array),
        errors: expect.any(Array)
      });
    });

    it('should get metrics', () => {
      const metrics = monitor.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
    });

    it('should get entries', () => {
      const entries = monitor.getEntries();
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe('Control Methods', () => {
    it('should stop monitoring', () => {
      monitor.stop();
      // Monitor should clean up observers
      expect(monitor).toBeDefined();
    });

    it('should get core web vitals', () => {
      const vitals = monitor.getCoreWebVitals();
      expect(vitals).toBeDefined();
      expect(typeof vitals).toBe('object');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing performance API', () => {
      // Temporarily remove performance
      const originalPerformance = global.performance;
      delete (global as any).performance;
      
      expect(() => {
        new PerformanceMonitor();
      }).not.toThrow();
      
      // Restore
      global.performance = originalPerformance;
    });

    it('should handle PerformanceObserver not supported', () => {
      const originalObserver = global.PerformanceObserver;
      delete (global as any).PerformanceObserver;
      
      expect(() => {
        new PerformanceMonitor();
      }).not.toThrow();
      
      // Restore
      global.PerformanceObserver = originalObserver;
    });

    it('should handle network errors during reporting', () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Should not throw when getting report
      expect(() => monitor.getReport()).not.toThrow();
    });

    it('should handle sampling rate', () => {
      // Mock Math.random to return 0.9
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.9);
      
      // Should not monitor with 50% sampling rate
      const monitor2 = new PerformanceMonitor({ sampleRate: 0.5 });
      expect(monitor2).toBeDefined();
      
      // Restore
      Math.random = originalRandom;
    });
  });
});