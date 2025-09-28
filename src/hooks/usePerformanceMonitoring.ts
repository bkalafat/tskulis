/**
 * Performance Monitoring Hook
 * Initializes and manages Web Vitals tracking
 */

import { useEffect } from 'react';
import { initPerformanceMonitoring, recordCustomMetric } from '../lib/performance';

interface UsePerformanceMonitoringProps {
  enabled?: boolean;
  sampleRate?: number;
  debug?: boolean;
}

export const usePerformanceMonitoring = ({
  enabled = true,
  sampleRate = 1.0,
  debug = false,
}: UsePerformanceMonitoringProps = {}) => {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return undefined;

    // Initialize performance monitoring
    initPerformanceMonitoring({
      endpoint: '/api/performance',
      sampleRate,
      debug,
      enableAnalytics: true,
      enableRUM: true,
    });

    // Record page load metric
    recordCustomMetric('page-load', Date.now());

    // Track route changes for SPA
    const trackRouteChange = () => {
      recordCustomMetric('route-change', Date.now());
    };

    // Listen for history changes
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      trackRouteChange();
      return originalPushState.apply(history, args);
    };

    history.replaceState = function(...args) {
      trackRouteChange();
      return originalReplaceState.apply(history, args);
    };

    window.addEventListener('popstate', trackRouteChange);

    // Cleanup
    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', trackRouteChange);
    };
  }, [enabled, sampleRate, debug]);
};