/**
 * Development Environment System
 * Complete development tools, debugging utilities, and environment configuration
 */

// Core development modules
export { default as DevelopmentEnvironment, devEnvironment, DevServerConfig, EnvUtils } from './environment';
export { default as DevTools, devTools, DevMiddleware } from './dev-tools';

// Import for internal use
import DevelopmentEnvironment, { devEnvironment } from './environment';
import DevTools, { devTools } from './dev-tools';

// Development utilities
export const DevUtils = {
  // Check if running in development
  isDev: () => process.env.NODE_ENV === 'development',
  
  // Check if debugging is enabled
  isDebugging: () => process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development',
  
  // Performance timing
  time: (label: string) => {
    if (typeof window !== 'undefined' && window.performance) {
      performance.mark(`${label}-start`);
      return {
        end: () => {
          performance.mark(`${label}-end`);
          performance.measure(label, `${label}-start`, `${label}-end`);
          const measure = performance.getEntriesByName(label)[0];
          console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
          return measure.duration;
        }
      };
    }
    const start = Date.now();
    return {
      end: () => {
        const duration = Date.now() - start;
        console.log(`⏱️ ${label}: ${duration}ms`);
        return duration;
      }
    };
  },
  
  // Memory monitoring
  getMemoryUsage: () => {
    if (typeof window !== 'undefined') {
      const memory = (performance as any).memory;
      if (memory) {
        return {
          used: Math.round(memory.usedJSHeapSize / 1048576),
          total: Math.round(memory.totalJSHeapSize / 1048576),
          limit: Math.round(memory.jsHeapSizeLimit / 1048576)
        };
      }
    }
    
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        rss: Math.round(usage.rss / 1048576),
        heapTotal: Math.round(usage.heapTotal / 1048576),
        heapUsed: Math.round(usage.heapUsed / 1048576),
        external: Math.round(usage.external / 1048576)
      };
    }
    
    return null;
  },
  
  // Environment information
  getEnvInfo: () => ({
    isDevelopment: DevUtils.isDev(),
    isDebugging: DevUtils.isDebugging(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A',
    platform: typeof navigator !== 'undefined' ? navigator.platform : process.platform,
    language: typeof navigator !== 'undefined' ? navigator.language : 'N/A',
    cookieEnabled: typeof navigator !== 'undefined' ? navigator.cookieEnabled : true,
    onLine: typeof navigator !== 'undefined' ? navigator.onLine : true,
    nodeVersion: typeof process !== 'undefined' ? process.version : 'N/A',
    timestamp: Date.now()
  })
};

// Development configuration presets
export const DevPresets = {
  // Full development environment
  fullDevelopment: {
    environment: {
      hotReload: true,
      sourceMaps: true,
      debugging: true,
      profiling: true,
      errorOverlay: true,
      fastRefresh: true,
      typescript: true,
      linting: true
    },
    devTools: {
      enabled: true,
      logLevel: 'verbose' as const,
      persistLogs: true,
      networkTracking: true,
      performanceTracking: true,
      componentInspection: true
    }
  },
  
  // Minimal development (faster builds)
  minimal: {
    environment: {
      hotReload: true,
      sourceMaps: false,
      debugging: false,
      profiling: false,
      errorOverlay: true,
      fastRefresh: true,
      typescript: true,
      linting: false
    },
    devTools: {
      enabled: false,
      logLevel: 'error' as const,
      persistLogs: false,
      networkTracking: false,
      performanceTracking: false,
      componentInspection: false
    }
  },
  
  // Testing environment
  testing: {
    environment: {
      hotReload: false,
      sourceMaps: true,
      debugging: true,
      profiling: false,
      errorOverlay: false,
      fastRefresh: false,
      typescript: true,
      linting: true
    },
    devTools: {
      enabled: true,
      logLevel: 'error' as const,
      persistLogs: false,
      networkTracking: true,
      performanceTracking: false,
      componentInspection: false
    }
  }
};

// Initialize development environment based on NODE_ENV
export function initDevEnvironment(preset?: keyof typeof DevPresets) {
  if (process.env.NODE_ENV !== 'development') return;
  
  const config = preset ? DevPresets[preset] : DevPresets.fullDevelopment;
  
  // Initialize environment
  const env = new DevelopmentEnvironment(config.environment);
  
  // Initialize dev tools
  const tools = new DevTools(config.devTools);
  
  console.log(`🚀 Development environment initialized with preset: ${preset || 'fullDevelopment'}`);
  
  return {
    environment: env,
    tools
  };
}

// Development shortcuts for global access
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).__DEV_UTILS__ = {
    ...DevUtils,
    initEnvironment: initDevEnvironment,
    presets: DevPresets,
    environment: devEnvironment,
    tools: devTools
  };
}

export default {
  DevelopmentEnvironment,
  DevTools,
  DevUtils,
  DevPresets,
  initDevEnvironment
};