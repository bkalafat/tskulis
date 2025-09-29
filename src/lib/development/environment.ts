/**
 * Development Environment Utilities
 * Hot Module Replacement, debugging tools, and development enhancements
 */

interface DevEnvironmentConfig {
  hotReload: boolean;
  sourceMaps: boolean;
  debugging: boolean;
  profiling: boolean;
  errorOverlay: boolean;
  fastRefresh: boolean;
  typescript: boolean;
  linting: boolean;
}

interface DevServer {
  port: number;
  host: string;
  https: boolean;
  open: boolean;
  hmr: boolean;
  overlay: boolean;
  stats: 'minimal' | 'detailed' | 'errors-only';
}

interface PerformanceProfiler {
  enabled: boolean;
  componentProfiling: boolean;
  renderTracking: boolean;
  memoryTracking: boolean;
  bundleAnalysis: boolean;
}

export class DevelopmentEnvironment {
  private config: DevEnvironmentConfig;
  private profiler: PerformanceProfiler;
  private hmrUpdateCount = 0;
  private lastHmrUpdate = Date.now();

  constructor(config: Partial<DevEnvironmentConfig> = {}) {
    this.config = {
      hotReload: true,
      sourceMaps: true,
      debugging: true,
      profiling: process.env.NODE_ENV === 'development',
      errorOverlay: true,
      fastRefresh: true,
      typescript: true,
      linting: true,
      ...config
    };

    this.profiler = {
      enabled: this.config.profiling,
      componentProfiling: false,
      renderTracking: false,
      memoryTracking: false,
      bundleAnalysis: false
    };

    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    console.log('🚀 Development Environment initialized');
    
    // Set up development utilities
    this.setupHMR();
    this.setupErrorHandling();
    this.setupPerformanceMonitoring();
    this.setupDebuggingTools();
  }

  // Hot Module Replacement setup
  private setupHMR() {
    if (!this.config.hotReload || typeof window === 'undefined') return;

    // HMR event listeners with type safety
    const moduleHot = (module as any).hot;
    if (moduleHot) {
      moduleHot.accept((err: any) => {
        if (err) {
          console.error('🔥 HMR Error:', err);
        } else {
          this.hmrUpdateCount++;
          this.lastHmrUpdate = Date.now();
          console.log(`🔥 HMR Update #${this.hmrUpdateCount}`);
        }
      });

      // Custom HMR handling
      moduleHot.dispose(() => {
        console.log('🔥 HMR Dispose - cleaning up');
      });

      // Error handling
      if (moduleHot.addErrorHandler) {
        moduleHot.addErrorHandler((err: any) => {
          console.error('🔥 HMR Runtime Error:', err);
        });
      }
    }

    // React Fast Refresh integration
    if (this.config.fastRefresh && (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      console.log('⚡ React Fast Refresh enabled');
    }
  }

  // Error overlay and handling
  private setupErrorHandling() {
    if (!this.config.errorOverlay) return;

    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack
      });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise',
        message: event.reason?.toString() || 'Unhandled Promise Rejection',
        error: event.reason,
        stack: event.reason?.stack
      });
    });

    console.log('🛠️ Error overlay enabled');
  }

  // Performance monitoring for development
  private setupPerformanceMonitoring() {
    if (!this.profiler.enabled) return;

    // Component render tracking
    if (this.profiler.componentProfiling) {
      this.setupComponentProfiling();
    }

    // Memory monitoring
    if (this.profiler.memoryTracking) {
      this.setupMemoryMonitoring();
    }

    console.log('📊 Performance monitoring enabled');
  }

  private setupComponentProfiling() {
    // React DevTools Profiler integration
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const devtools = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      // Track component updates
      if (devtools.onCommitFiberRoot) {
        const originalOnCommit = devtools.onCommitFiberRoot;
        devtools.onCommitFiberRoot = (...args: any[]) => {
          const [, root] = args;
          console.log('🔍 Component tree updated:', root);
          return originalOnCommit.apply(devtools, args);
        };
      }
    }
  }

  private setupMemoryMonitoring() {
    const perfMemory = (performance as any).memory;
    if (!perfMemory) return;

    // Monitor memory usage periodically
    setInterval(() => {
      const memory = perfMemory;
      const memoryInfo = {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      };

      // Warn if memory usage is high
      if (memoryInfo.used > memoryInfo.limit * 0.8) {
        console.warn('⚠️ High memory usage:', memoryInfo);
      }
    }, 10000); // Check every 10 seconds
  }

  // Development debugging tools
  private setupDebuggingTools() {
    if (!this.config.debugging) return;

    // Global debugging helpers
    (window as any).__DEV_TOOLS__ = {
      // Component inspector
      inspectComponent: (element: Element) => {
        const reactFiber = this.getReactFiber(element);
        if (reactFiber) {
          console.log('🔍 Component:', reactFiber);
          return reactFiber;
        }
        return null;
      },

      // Performance helpers
      profileRender: (name: string, fn: Function) => {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        console.log(`⏱️ ${name} render: ${duration.toFixed(2)}ms`);
        return result;
      },

      // State inspector
      logState: (state: any, label?: string) => {
        console.group(`🔍 State ${label ? `(${label})` : ''}`);
        console.log(state);
        console.groupEnd();
      },

      // Network inspector
      logNetworkRequests: () => {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
              console.log('🌐 Network:', entry);
            }
          });
        });
        observer.observe({ entryTypes: ['navigation', 'resource'] });
      },

      // Bundle analyzer
      analyzeBundles: () => {
        const scripts = document.querySelectorAll('script[src]');
        const styles = document.querySelectorAll('link[rel="stylesheet"]');
        
        console.group('📦 Bundle Analysis');
        console.log(`Scripts: ${scripts.length}`);
        console.log(`Stylesheets: ${styles.length}`);
        
        Array.from(scripts).forEach((script) => {
          const scriptEl = script as HTMLScriptElement;
          console.log(`- ${scriptEl.src}`);
        });
        
        Array.from(styles).forEach((style) => {
          const styleEl = style as HTMLLinkElement;
          console.log(`- ${styleEl.href}`);
        });
        console.groupEnd();
      }
    };

    console.log('🛠️ Development debugging tools available at window.__DEV_TOOLS__');
  }

  private getReactFiber(element: Element): any {
    const fiberKey = Object.keys(element).find(key => 
      key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    );
    return fiberKey ? (element as any)[fiberKey] : null;
  }

  private handleError(errorInfo: {
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    error?: Error;
    stack?: string;
  }) {
    console.group('🚨 Development Error');
    console.error(`Type: ${errorInfo.type}`);
    console.error(`Message: ${errorInfo.message}`);
    
    if (errorInfo.filename) {
      console.error(`File: ${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}`);
    }
    
    if (errorInfo.stack) {
      console.error('Stack trace:', errorInfo.stack);
    }
    
    console.groupEnd();

    // Create error overlay if enabled
    this.showErrorOverlay(errorInfo);
  }

  private showErrorOverlay(errorInfo: any) {
    // Remove existing overlay
    const existingOverlay = document.getElementById('dev-error-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create error overlay
    const overlay = document.createElement('div');
    overlay.id = 'dev-error-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      color: #ff6b6b;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      z-index: 9999;
      overflow: auto;
      padding: 20px;
    `;

    overlay.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto;">
        <h2 style="color: #ff6b6b; margin: 0 0 20px 0;">
          🚨 Development Error
        </h2>
        <div style="background: #2d2d2d; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
          <strong>Type:</strong> ${errorInfo.type}<br>
          <strong>Message:</strong> ${errorInfo.message}
          ${errorInfo.filename ? `<br><strong>File:</strong> ${errorInfo.filename}:${errorInfo.lineno}:${errorInfo.colno}` : ''}
        </div>
        ${errorInfo.stack ? `
          <div style="background: #2d2d2d; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
            <strong>Stack Trace:</strong><br>
            <pre style="margin: 10px 0; white-space: pre-wrap;">${errorInfo.stack}</pre>
          </div>
        ` : ''}
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: #ff6b6b; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(overlay);

    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 10000);
  }

  // Public API methods
  public enableProfiling() {
    this.profiler.enabled = true;
    this.profiler.componentProfiling = true;
    this.profiler.renderTracking = true;
    this.profiler.memoryTracking = true;
    
    this.setupComponentProfiling();
    this.setupMemoryMonitoring();
    
    console.log('📊 Profiling enabled');
  }

  public disableProfiling() {
    this.profiler.enabled = false;
    this.profiler.componentProfiling = false;
    this.profiler.renderTracking = false;
    this.profiler.memoryTracking = false;
    
    console.log('📊 Profiling disabled');
  }

  public getStats() {
    const perfMemory = (performance as any).memory;
    return {
      hmrUpdates: this.hmrUpdateCount,
      lastHmrUpdate: this.lastHmrUpdate,
      config: this.config,
      profiler: this.profiler,
      memory: perfMemory ? {
        used: Math.round(perfMemory.usedJSHeapSize / 1048576),
        total: Math.round(perfMemory.totalJSHeapSize / 1048576),
        limit: Math.round(perfMemory.jsHeapSizeLimit / 1048576)
      } : null
    };
  }
}

// Development server configuration
export const DevServerConfig = {
  // Default development server settings
  createConfig: (customConfig: Partial<DevServer> = {}): DevServer => ({
    port: 3000,
    host: 'localhost',
    https: false,
    open: true,
    hmr: true,
    overlay: true,
    stats: 'minimal',
    ...customConfig
  }),

  // Hot reload configuration for Next.js
  nextjsConfig: {
    experimental: {
      fastRefresh: true
    },
    webpack: (config: any, { dev }: { dev: boolean }) => {
      if (dev) {
        // Enable source maps
        config.devtool = 'eval-cheap-module-source-map';
        
        // Fast refresh
        config.resolve.alias = {
          ...config.resolve.alias,
          'react-dom$': 'react-dom/profiling',
          'scheduler/tracing': 'scheduler/tracing-profiling'
        };
        
        // Development plugins
        config.plugins.push(
          new (require('webpack').HotModuleReplacementPlugin)()
        );
      }
      
      return config;
    }
  },

  // Webpack dev server configuration
  webpackDevServer: {
    hot: true,
    hotOnly: true,
    overlay: {
      warnings: false,
      errors: true
    },
    stats: 'minimal',
    noInfo: true,
    clientLogLevel: 'silent',
    compress: true,
    disableHostCheck: true,
    historyApiFallback: true,
    before: (app: any) => {
      // Custom middleware for development
      app.use('/dev-api', (_req: any, res: any) => {
        res.json({ message: 'Development API endpoint' });
      });
    }
  }
};

// Environment detection utilities
export const EnvUtils = {
  isDevelopment: () => process.env.NODE_ENV === 'development',
  isProduction: () => process.env.NODE_ENV === 'production',
  isTest: () => process.env.NODE_ENV === 'test',
  
  // Feature flags for development
  features: {
    enableDebugTools: () => EnvUtils.isDevelopment() && !process.env.DISABLE_DEBUG_TOOLS,
    enablePerformanceProfiling: () => EnvUtils.isDevelopment() && process.env.ENABLE_PROFILING === 'true',
    enableErrorOverlay: () => EnvUtils.isDevelopment() && !process.env.DISABLE_ERROR_OVERLAY,
    enableHotReload: () => EnvUtils.isDevelopment() && !process.env.DISABLE_HMR
  },
  
  // Environment info
  getEnvInfo: () => ({
    nodeEnv: process.env.NODE_ENV,
    isDev: EnvUtils.isDevelopment(),
    isProd: EnvUtils.isProduction(),
    isTest: EnvUtils.isTest(),
    features: {
      debugTools: EnvUtils.features.enableDebugTools(),
      profiling: EnvUtils.features.enablePerformanceProfiling(),
      errorOverlay: EnvUtils.features.enableErrorOverlay(),
      hotReload: EnvUtils.features.enableHotReload()
    }
  })
};

// Create default development environment instance
export const devEnvironment = new DevelopmentEnvironment();

export default DevelopmentEnvironment;