/**
 * Advanced Code Splitting Utilities
 * Provides intelligent code splitting, dynamic imports, and lazy loading
 * with performance monitoring and error boundaries
 */

import React, { lazy, Suspense, ComponentType, ReactElement, ErrorInfo, Component, useState, useEffect } from 'react';
import { NextComponentType, NextPageContext } from 'next';

interface SplitComponentOptions {
  loading?: ComponentType | ReactElement;
  error?: ComponentType<{ error: Error; retry: () => void }>;
  delay?: number;
  timeout?: number;
  fallback?: ComponentType;
  preload?: boolean;
  priority?: 'low' | 'normal' | 'high';
  chunkName?: string;
}

interface LoadingMetrics {
  componentName: string;
  loadTime: number;
  success: boolean;
  error?: string;
  chunkSize?: number;
  fromCache: boolean;
  timestamp: number;
}

interface ChunkInfo {
  name: string;
  size: number;
  loaded: boolean;
  loadTime?: number;
  error?: string;
  dependencies: string[];
}

// Global metrics tracking
const splitMetrics: LoadingMetrics[] = [];
const chunkRegistry: Map<string, ChunkInfo> = new Map();
const preloadQueue: Map<string, Promise<any>> = new Map();

// Error boundary for split components
class SplitComponentErrorBoundary extends Component<
  { 
    fallback?: ComponentType<{ error: Error; retry: () => void }>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    children: React.ReactNode;
  },
  { hasError: boolean; error: Error | null }
> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Code Split Error]:', error, errorInfo);
    
    // Track error
    splitMetrics.push({
      componentName: 'unknown',
      loadTime: 0,
      success: false,
      error: error.message,
      fromCache: false,
      timestamp: Date.now()
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  retry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      this.setState({ hasError: false, error: null });
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error} retry={this.retry} />;
      }
      
      return (
        <div style={{ 
          padding: '20px', 
          border: '1px solid #ff6b6b', 
          borderRadius: '4px',
          backgroundColor: '#ffe0e0',
          color: '#d63031'
        }}>
          <h3>Component Loading Error</h3>
          <p>{this.state.error.message}</p>
          {this.retryCount < this.maxRetries && (
            <button onClick={this.retry} style={{ 
              padding: '8px 16px',
              backgroundColor: '#d63031',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}>
              Retry ({this.maxRetries - this.retryCount} attempts left)
            </button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Default loading component
const DefaultLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    color: '#666'
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '3px solid #f3f3f3',
      borderTop: '3px solid #007bff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

/**
 * Create a code-split component with advanced features
 */
export function createSplitComponent<P = {}>(
  importFn: () => Promise<{ default: ComponentType<P> }>,
  options: SplitComponentOptions = {}
): ComponentType<P> {
  const {
    loading = DefaultLoader,
    error,
    delay = 200,
    timeout = 10000,
    preload = false,
    priority = 'normal',
    chunkName
  } = options;

  // Create lazy component with metrics tracking
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    const componentName = chunkName || importFn.toString();
    
    try {
      // Check if already in preload queue
      const preloadPromise = preloadQueue.get(componentName);
      let modulePromise: Promise<{ default: ComponentType<P> }>;
      
      if (preloadPromise) {
        modulePromise = preloadPromise;
      } else {
        modulePromise = importFn();
        if (preload) {
          preloadQueue.set(componentName, modulePromise);
        }
      }

      // Add timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Component load timeout: ${componentName}`)), timeout);
      });

      const module = await Promise.race([modulePromise, timeoutPromise]);
      const loadTime = performance.now() - startTime;

      // Track successful load
      splitMetrics.push({
        componentName,
        loadTime,
        success: true,
        fromCache: !!preloadPromise,
        timestamp: Date.now()
      });

      // Update chunk registry
      chunkRegistry.set(componentName, {
        name: componentName,
        size: 0, // Would need webpack stats
        loaded: true,
        loadTime,
        dependencies: []
      });

      console.log(`[Code Split] Loaded ${componentName} in ${loadTime.toFixed(2)}ms`);
      return module;

    } catch (loadError) {
      const loadTime = performance.now() - startTime;
      const error = loadError instanceof Error ? loadError : new Error(String(loadError));
      
      // Track failed load
      splitMetrics.push({
        componentName,
        loadTime,
        success: false,
        error: error.message,
        fromCache: false,
        timestamp: Date.now()
      });

      console.error(`[Code Split] Failed to load ${componentName}:`, error);
      throw error;
    }
  });

  // Return wrapped component
  return (props: P) => {
    const LoadingComponent = loading as ComponentType;
    
    return (
      <SplitComponentErrorBoundary fallback={error}>
        <React.Suspense fallback={<LoadingComponent />}>
          <LazyComponent {...props} />
        </React.Suspense>
      </SplitComponentErrorBoundary>
    );
  };
}

/**
 * Preload components for better performance
 */
export function preloadComponent(importFn: () => Promise<any>, chunkName?: string): Promise<any> {
  const name = chunkName || importFn.toString();
  
  if (preloadQueue.has(name)) {
    return preloadQueue.get(name)!;
  }

  const promise = importFn().catch(error => {
    console.error(`[Code Split] Preload failed for ${name}:`, error);
    preloadQueue.delete(name);
    throw error;
  });

  preloadQueue.set(name, promise);
  return promise;
}

/**
 * Route-based code splitting utilities
 */
export const RouteComponents = {
  // Create split page component
  createSplitPage<P = {}>(
    importFn: () => Promise<{ default: NextComponentType<NextPageContext, any, P> }>,
    options: SplitComponentOptions = {}
  ) {
    return createSplitComponent(importFn, {
      ...options,
      chunkName: options.chunkName || 'page'
    });
  },

  // Preload routes based on user behavior
  setupRoutePreloading() {
    if (typeof window === 'undefined') return;

    // Preload on link hover
    const setupLinkPreloading = () => {
      document.addEventListener('mouseover', (event) => {
        const link = event.target as HTMLAnchorElement;
        if (link.tagName === 'A' && link.href) {
          const route = new URL(link.href).pathname;
          this.preloadRoute(route);
        }
      });
    };

    // Preload on viewport intersection
    const setupViewportPreloading = () => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement;
            if (link.href) {
              const route = new URL(link.href).pathname;
              this.preloadRoute(route);
            }
          }
        });
      }, { rootMargin: '50px' });

      document.querySelectorAll('a[href]').forEach(link => {
        observer.observe(link);
      });
    };

    // Setup both strategies
    setupLinkPreloading();
    setupViewportPreloading();
  },

  preloadRoute(route: string) {
    // This would need to be integrated with Next.js router
    console.log(`[Route Preload] Preloading route: ${route}`);
  }
};

/**
 * Feature-based code splitting
 */
export const FeatureComponents = {
  // Split by feature
  createFeatureBundle<T = any>(features: {
    [key: string]: () => Promise<{ default: ComponentType<T> }>
  }) {
    const splitFeatures: { [key: string]: ComponentType<T> } = {};
    
    Object.entries(features).forEach(([name, importFn]) => {
      splitFeatures[name] = createSplitComponent(importFn, {
        chunkName: `feature-${name}`
      });
    });
    
    return splitFeatures;
  },

  // Conditional feature loading
  async loadFeatureConditionally<T = any>(
    condition: boolean | (() => boolean),
    importFn: () => Promise<{ default: ComponentType<T> }>,
    fallback?: ComponentType<T>
  ): Promise<ComponentType<T>> {
    const shouldLoad = typeof condition === 'function' ? condition() : condition;
    
    if (!shouldLoad && fallback) {
      return fallback;
    }
    
    if (shouldLoad) {
      try {
        const module = await importFn();
        return module.default;
      } catch (error) {
        console.error('[Conditional Load] Failed:', error);
        if (fallback) return fallback;
        throw error;
      }
    }
    
    // Return empty component if no fallback
    return () => null;
  }
};

/**
 * Performance monitoring utilities
 */
export const SplitMetrics = {
  // Get loading metrics
  getMetrics(): LoadingMetrics[] {
    return [...splitMetrics];
  },

  // Get chunk information
  getChunkInfo(): ChunkInfo[] {
    return Array.from(chunkRegistry.values());
  },

  // Calculate performance stats
  getPerformanceStats() {
    const metrics = this.getMetrics();
    const successful = metrics.filter(m => m.success);
    const failed = metrics.filter(m => !m.success);
    
    return {
      totalLoads: metrics.length,
      successRate: metrics.length > 0 ? successful.length / metrics.length : 0,
      averageLoadTime: successful.length > 0 
        ? successful.reduce((sum, m) => sum + m.loadTime, 0) / successful.length
        : 0,
      cacheHitRate: successful.length > 0
        ? successful.filter(m => m.fromCache).length / successful.length
        : 0,
      failureReasons: failed.reduce((reasons, m) => {
        const error = m.error || 'Unknown error';
        reasons[error] = (reasons[error] || 0) + 1;
        return reasons;
      }, {} as { [error: string]: number })
    };
  },

  // Clear metrics
  clearMetrics() {
    splitMetrics.length = 0;
    chunkRegistry.clear();
  },

  // Export metrics
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      chunks: this.getChunkInfo(),
      stats: this.getPerformanceStats()
    };
  }
};

/**
 * Bundle size estimation utilities
 */
export const BundleEstimator = {
  // Estimate component bundle size (rough estimation)
  async estimateComponentSize(importFn: () => Promise<any>): Promise<number> {
    try {
      const startTime = performance.now();
      await importFn();
      const loadTime = performance.now() - startTime;
      
      // Very rough estimation based on load time
      // This is not accurate and would need webpack stats for real data
      return Math.floor(loadTime * 100); // Rough bytes estimation
    } catch (error) {
      console.error('[Bundle Estimator] Failed to estimate size:', error);
      return 0;
    }
  },

  // Monitor bundle growth
  trackBundleGrowth() {
    const sizes: { [chunk: string]: number[] } = {};
    
    return {
      record: (chunkName: string, size: number) => {
        if (!sizes[chunkName]) {
          sizes[chunkName] = [];
        }
        sizes[chunkName].push(size);
      },
      
      getGrowthData: () => sizes,
      
      getGrowthReport: () => {
        const report: { [chunk: string]: { growth: number; trend: 'increasing' | 'decreasing' | 'stable' } } = {};
        
        Object.entries(sizes).forEach(([chunk, measurements]) => {
          if (measurements.length < 2) {
            report[chunk] = { growth: 0, trend: 'stable' };
            return;
          }
          
          const first = measurements[0];
          const last = measurements[measurements.length - 1];
          const growth = ((last - first) / first) * 100;
          
          let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
          if (Math.abs(growth) > 5) {
            trend = growth > 0 ? 'increasing' : 'decreasing';
          }
          
          report[chunk] = { growth, trend };
        });
        
        return report;
      }
    };
  }
};

// Hook for using split components
export function useSplitComponent<T = any>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  deps: any[] = []
) {
  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    importFn()
      .then(module => {
        if (!cancelled) {
          setComponent(() => module.default);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, deps);

  return { Component, loading, error };
}

export default {
  createSplitComponent,
  preloadComponent,
  RouteComponents,
  FeatureComponents,
  SplitMetrics,
  BundleEstimator,
  useSplitComponent
};