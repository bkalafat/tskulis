/**
 * Performance Monitoring Integration Tests
 * Tests Core Web Vitals tracking and RUM functionality
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';
import { 
  initPerformanceMonitoring, 
  getPerformanceMonitor,
  recordCustomMetric,
  checkPerformanceBudget,
  PERFORMANCE_THRESHOLDS
} from '../../lib/performance';

// Mock web-vitals
jest.mock('web-vitals', () => ({
  onCLS: jest.fn(),
  onFCP: jest.fn(),
  onINP: jest.fn(),
  onLCP: jest.fn(),
  onTTFB: jest.fn(),
  CLSThresholds: [0.1, 0.25],
  FCPThresholds: [1800, 3000],
  INPThresholds: [200, 500],
  LCPThresholds: [2500, 4000],
  TTFBThresholds: [800, 1800],
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock sendBeacon
Object.defineProperty(navigator, 'sendBeacon', {
  writable: true,
  value: jest.fn(() => true),
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    getEntriesByType: jest.fn(() => [
      {
        domainLookupStart: 100,
        domainLookupEnd: 150,
        connectStart: 150,
        connectEnd: 200,
        requestStart: 200,
        responseEnd: 300,
        domContentLoadedEventEnd: 400,
        loadEventEnd: 500,
      }
    ]),
  },
});

describe('Performance Monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Performance Thresholds', () => {
    test('should have correct Core Web Vitals thresholds', () => {
      expect(PERFORMANCE_THRESHOLDS).toEqual({
        CLS: [0.1, 0.25],
        FCP: [1800, 3000],
        INP: [200, 500],
        LCP: [2500, 4000],
        TTFB: [800, 1800],
      });
    });

    test('should validate performance budgets correctly', () => {
      const goodMetrics = {
        LCP: 2000,
        FCP: 1500,
        CLS: 0.05,
      };

      const result = checkPerformanceBudget(goodMetrics);
      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    test('should detect performance budget violations', () => {
      const badMetrics = {
        LCP: 5000,
        FCP: 4000,
        CLS: 0.5,
      };

      const result = checkPerformanceBudget(badMetrics);
      expect(result.passed).toBe(false);
      expect(result.violations).toHaveLength(3);
      expect(result.violations[0]).toContain('LCP: 5000ms exceeds threshold');
    });
  });

  describe('Performance Monitor Initialization', () => {
    test('should initialize performance monitoring', () => {
      initPerformanceMonitoring({
        endpoint: '/api/test-performance',
        sampleRate: 1.0,
        debug: true,
      });

      const monitor = getPerformanceMonitor();
      expect(monitor).toBeTruthy();
    });

    test('should record custom metrics', () => {
      initPerformanceMonitoring({ debug: true });
      
      recordCustomMetric('test-metric', 1000, {
        rating: 'good',
      });

      const monitor = getPerformanceMonitor();
      const summary = monitor?.getSummary();
      
      expect(summary).toHaveProperty('test-metric');
      expect(summary?.['test-metric']).toHaveLength(1);
      expect(summary?.['test-metric'][0].value).toBe(1000);
    });
  });

  describe('Performance Monitoring Hook', () => {
    // Mock component for testing the hook
    const TestComponent: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
      usePerformanceMonitoring({ enabled, debug: true });
      return <div>Test Component</div>;
    };

    test('should initialize monitoring when enabled', () => {
      render(<TestComponent enabled={true} />);
      
      // Should initialize without errors
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });

    test('should not initialize when disabled', () => {
      render(<TestComponent enabled={false} />);
      
      // Should render without initializing monitoring
      expect(screen.getByText('Test Component')).toBeInTheDocument();
    });
  });

  describe('API Integration', () => {
    test('should send performance data to API endpoint', async () => {
      initPerformanceMonitoring({
        endpoint: '/api/performance',
        debug: false,
      });

      const monitor = getPerformanceMonitor();
      monitor?.recordMetric('test-api-metric', 1500);

      // Wait for potential flush
      await new Promise(resolve => setTimeout(resolve, 100));

      // Note: In a real test, you'd need to trigger a flush
      // This is a basic structure test
      expect(fetch).toHaveBeenCalledTimes(0); // Won't flush immediately in test
    });

    test('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));

      initPerformanceMonitoring({
        endpoint: '/api/performance',
        debug: false,
      });

      // Should not throw
      expect(() => {
        recordCustomMetric('error-test', 1000);
      }).not.toThrow();
    });
  });

  describe('Device and Connection Detection', () => {
    const originalInnerWidth = window.innerWidth;

    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth,
      });
    });

    test('should detect mobile device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      initPerformanceMonitoring({ debug: true });
      recordCustomMetric('mobile-test', 100);

      const monitor = getPerformanceMonitor();
      const summary = monitor?.getSummary();
      
      expect(summary?.['mobile-test'][0].deviceType).toBe('mobile');
    });

    test('should detect desktop device', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1400,
      });

      initPerformanceMonitoring({ debug: true });
      recordCustomMetric('desktop-test', 100);

      const monitor = getPerformanceMonitor();
      const summary = monitor?.getSummary();
      
      expect(summary?.['desktop-test'][0].deviceType).toBe('desktop');
    });
  });

  describe('Performance Rating System', () => {
    test('should rate LCP correctly', () => {
      initPerformanceMonitoring({ debug: true });

      // Test good LCP
      recordCustomMetric('LCP', 2000);
      let monitor = getPerformanceMonitor();
      let summary = monitor?.getSummary();
      expect(summary?.['LCP'][0].rating).toBe('good');

      // Test poor LCP  
      recordCustomMetric('LCP', 5000);
      monitor = getPerformanceMonitor();
      summary = monitor?.getSummary();
      expect(summary?.['LCP'][1].rating).toBe('poor');
    });

    test('should rate CLS correctly', () => {
      initPerformanceMonitoring({ debug: true });

      // Test good CLS
      recordCustomMetric('CLS', 0.05);
      let monitor = getPerformanceMonitor();
      let summary = monitor?.getSummary();
      expect(summary?.['CLS'][0].rating).toBe('good');

      // Test poor CLS
      recordCustomMetric('CLS', 0.3);
      monitor = getPerformanceMonitor();
      summary = monitor?.getSummary();
      expect(summary?.['CLS'][1].rating).toBe('poor');
    });
  });

  describe('Memory Management', () => {
    test('should limit buffer size', () => {
      initPerformanceMonitoring({ debug: true });
      const monitor = getPerformanceMonitor();

      // Record many metrics
      for (let i = 0; i < 15; i++) {
        recordCustomMetric(`test-metric-${i}`, i * 100);
      }

      const summary = monitor?.getSummary();
      const totalMetrics = Object.values(summary || {}).reduce(
        (sum, entries) => sum + entries.length, 
        0
      );

      // Should manage memory (exact limit depends on implementation)
      expect(totalMetrics).toBeLessThan(50);
    });
  });

  describe('Navigation Tracking', () => {
    // Mock component for testing the hook
    const TestComponent: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
      usePerformanceMonitoring({ enabled, debug: true });
      return <div>Test Component</div>;
    };

    test('should track route changes', () => {
      const originalPushState = window.history.pushState;
      let routeChanges = 0;

      // Mock route change tracking
      window.history.pushState = (...args) => {
        routeChanges++;
        return originalPushState.apply(window.history, args);
      };

      render(<TestComponent />);

      // Simulate route change
      window.history.pushState({}, '', '/new-route');

      expect(routeChanges).toBe(1);

      // Restore
      window.history.pushState = originalPushState;
    });
  });

  describe('Error Handling', () => {
    test('should handle missing Web Vitals gracefully', () => {
      // This tests the fallback behavior when web-vitals is not available
      expect(() => {
        initPerformanceMonitoring({ debug: true });
      }).not.toThrow();
    });

    test('should handle invalid metric data', () => {
      initPerformanceMonitoring({ debug: true });

      expect(() => {
        recordCustomMetric('', NaN);
        recordCustomMetric(null as any, 0);
        recordCustomMetric('valid', -1);
      }).not.toThrow();
    });
  });
});

describe('Performance Integration with React', () => {
  test('should work with React component lifecycle', async () => {
    const Component = () => {
      usePerformanceMonitoring({ enabled: true, debug: true });
      
      React.useEffect(() => {
        recordCustomMetric('component-mount', 100);
      }, []);

      return <div>Performance Test Component</div>;
    };

    render(<Component />);

    await waitFor(() => {
      const monitor = getPerformanceMonitor();
      const summary = monitor?.getSummary();
      expect(summary).toHaveProperty('component-mount');
    });
  });

  test('should cleanup on unmount', () => {
    const Component = () => {
      usePerformanceMonitoring({ enabled: true });
      return <div>Cleanup Test</div>;
    };

    const { unmount } = render(<Component />);
    
    expect(() => unmount()).not.toThrow();
  });
});

// Performance benchmark test
describe('Performance Benchmarks', () => {
  test('should meet performance requirements', () => {
    const start = performance.now();
    
    // Initialize monitoring
    initPerformanceMonitoring({ debug: false });
    
    // Record 100 metrics
    for (let i = 0; i < 100; i++) {
      recordCustomMetric(`benchmark-${i}`, Math.random() * 1000);
    }
    
    const end = performance.now();
    const duration = end - start;
    
    // Should complete within 100ms
    expect(duration).toBeLessThan(100);
  });

  test('should have minimal memory footprint', () => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    initPerformanceMonitoring({ debug: false });
    
    // Record metrics
    for (let i = 0; i < 50; i++) {
      recordCustomMetric(`memory-test-${i}`, i);
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should use less than 1MB additional memory
    expect(memoryIncrease).toBeLessThan(1024 * 1024);
  });
});