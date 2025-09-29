/**
 * Development Tools and Debugging Utilities
 * Advanced debugging, profiling, and development assistance tools
 */

interface DevToolConfig {
  enabled: boolean;
  logLevel: 'verbose' | 'info' | 'warn' | 'error';
  persistLogs: boolean;
  networkTracking: boolean;
  performanceTracking: boolean;
  componentInspection: boolean;
}

interface LogEntry {
  timestamp: number;
  level: 'verbose' | 'info' | 'warn' | 'error';
  category: string;
  message: string;
  data?: any;
  stack?: string;
}

interface ComponentInfo {
  name: string;
  props: any;
  state: any;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  fiber?: any;
}

interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  size?: number;
  timestamp: number;
  headers?: { [key: string]: string };
  body?: any;
  response?: any;
}

export class DevTools {
  private config: DevToolConfig;
  private logs: LogEntry[] = [];
  private components: Map<string, ComponentInfo> = new Map();
  private networkRequests: Map<string, NetworkRequest> = new Map();
  private performanceMarks: Map<string, number> = new Map();

  constructor(config: Partial<DevToolConfig> = {}) {
    this.config = {
      enabled: process.env.NODE_ENV === 'development',
      logLevel: 'info',
      persistLogs: true,
      networkTracking: true,
      performanceTracking: true,
      componentInspection: true,
      ...config
    };

    if (this.config.enabled) {
      this.init();
    }
  }

  private init() {
    if (typeof window === 'undefined') return;

    console.log('🛠️ DevTools initialized');

    // Set up global dev tools
    this.setupGlobalTools();
    
    // Set up network tracking
    if (this.config.networkTracking) {
      this.setupNetworkTracking();
    }

    // Set up performance tracking
    if (this.config.performanceTracking) {
      this.setupPerformanceTracking();
    }

    // Set up component inspection
    if (this.config.componentInspection) {
      this.setupComponentInspection();
    }
  }

  private setupGlobalTools() {
    // Enhanced console methods
    (window as any).__DEV__ = {
      // Logging utilities
      log: this.createLogger('info'),
      warn: this.createLogger('warn'),
      error: this.createLogger('error'),
      verbose: this.createLogger('verbose'),
      
      // Component utilities
      inspect: this.inspectComponent.bind(this),
      findComponent: this.findComponent.bind(this),
      getComponentStats: this.getComponentStats.bind(this),
      
      // Performance utilities
      startTimer: this.startTimer.bind(this),
      endTimer: this.endTimer.bind(this),
      measureRender: this.measureRender.bind(this),
      
      // Network utilities
      getNetworkRequests: () => Array.from(this.networkRequests.values()),
      clearNetworkLogs: () => this.networkRequests.clear(),
      
      // State utilities
      logState: this.logState.bind(this),
      watchState: this.watchState.bind(this),
      
      // Memory utilities
      getMemoryInfo: this.getMemoryInfo.bind(this),
      forceGC: this.forceGC.bind(this),
      
      // General utilities
      exportLogs: () => this.exportLogs(),
      clearLogs: () => this.clearLogs(),
      getConfig: () => ({ ...this.config })
    };

    console.log('🛠️ Global dev tools available at window.__DEV__');
  }

  private createLogger(level: LogEntry['level']) {
    return (category: string, message: string, data?: any) => {
      if (!this.shouldLog(level)) return;

      const entry: LogEntry = {
        timestamp: Date.now(),
        level,
        category,
        message,
        data,
        stack: level === 'error' ? new Error().stack : undefined
      };

      this.logs.push(entry);

      // Console output with styling
      const styles = {
        verbose: 'color: #888',
        info: 'color: #0066cc',
        warn: 'color: #ff8800',
        error: 'color: #cc0000'
      };

      console.log(
        `%c[${level.toUpperCase()}] ${category}: ${message}`,
        styles[level],
        data || ''
      );

      // Persist logs if configured
      if (this.config.persistLogs) {
        this.persistLog(entry);
      }
    };
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = { verbose: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.config.logLevel];
  }

  private persistLog(entry: LogEntry) {
    try {
      const existingLogs = JSON.parse(localStorage.getItem('devtools-logs') || '[]');
      existingLogs.push(entry);
      
      // Keep only last 1000 entries
      if (existingLogs.length > 1000) {
        existingLogs.splice(0, existingLogs.length - 1000);
      }
      
      localStorage.setItem('devtools-logs', JSON.stringify(existingLogs));
    } catch (error) {
      console.warn('Failed to persist log:', error);
    }
  }

  private setupNetworkTracking() {
    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const startTime = performance.now();
      const url = args[0] as string;
      const options = args[1] as RequestInit || {};

      const request: NetworkRequest = {
        id: requestId,
        method: options.method || 'GET',
        url,
        timestamp: Date.now(),
        headers: options.headers as { [key: string]: string },
        body: options.body
      };

      this.networkRequests.set(requestId, request);

      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - startTime;

        // Update request with response data
        request.status = response.status;
        request.duration = duration;
        request.size = parseInt(response.headers.get('content-length') || '0');

        console.log(`🌐 ${request.method} ${url} - ${response.status} (${duration.toFixed(2)}ms)`);

        return response;
      } catch (error) {
        request.duration = performance.now() - startTime;
        console.error(`🌐 ${request.method} ${url} - ERROR (${request.duration.toFixed(2)}ms)`, error);
        throw error;
      }
    };

    // Intercept XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function(method: string, url: string, ...args: any[]) {
      (this as any)._devtools = {
        method,
        url,
        startTime: 0,
        requestId: `xhr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
      return originalXHROpen.call(this, method, url, ...args);
    };

    XMLHttpRequest.prototype.send = function(...args: any[]) {
      const devtools = (this as any)._devtools;
      if (devtools) {
        devtools.startTime = performance.now();
        
        this.addEventListener('loadend', () => {
          const duration = performance.now() - devtools.startTime;
          console.log(`🌐 ${devtools.method} ${devtools.url} - ${this.status} (${duration.toFixed(2)}ms)`);
        });
      }
      return originalXHRSend.apply(this, args);
    };
  }

  private setupPerformanceTracking() {
    // Track React component renders
    if ((window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      if (hook.onCommitFiberRoot) {
        const originalOnCommit = hook.onCommitFiberRoot;
        hook.onCommitFiberRoot = (...args: any[]) => {
          const [, root, , , actualDuration] = args;
          
          if (actualDuration > 16) { // > 16ms renders
            console.warn(`⚠️ Slow render detected: ${actualDuration.toFixed(2)}ms`);
          }
          
          return originalOnCommit.apply(hook, args);
        };
      }
    }

    // Performance observer for long tasks
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'longtask' && entry.duration > 50) {
            console.warn(`⚠️ Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        });
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
      } catch (error) {
        console.warn('Long task observation not supported');
      }
    }
  }

  private setupComponentInspection() {
    // Component selection tool
    let isInspecting = false;
    let originalCursor = '';

    (window as any).__DEV__.startInspecting = () => {
      if (isInspecting) return;
      
      isInspecting = true;
      originalCursor = document.body.style.cursor;
      document.body.style.cursor = 'crosshair';
      
      const handleClick = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        
        const component = this.findReactComponent(event.target as Element);
        if (component) {
          console.log('🔍 Component found:', component);
        }
        
        // Stop inspecting
        isInspecting = false;
        document.body.style.cursor = originalCursor;
        document.removeEventListener('click', handleClick, true);
      };
      
      document.addEventListener('click', handleClick, true);
      console.log('🔍 Click on any element to inspect its React component');
    };
  }

  // Public utility methods
  public inspectComponent(element: Element) {
    const component = this.findReactComponent(element);
    if (component) {
      console.group('🔍 Component Inspector');
      console.log('Element:', element);
      console.log('Component:', component);
      console.log('Props:', component.memoizedProps);
      console.log('State:', component.memoizedState);
      console.groupEnd();
      return component;
    }
    return null;
  }

  public findComponent(name: string): ComponentInfo | null {
    return this.components.get(name) || null;
  }

  public getComponentStats() {
    const stats = Array.from(this.components.values());
    console.table(stats);
    return stats;
  }

  public startTimer(name: string) {
    this.performanceMarks.set(name, performance.now());
    console.log(`⏱️ Timer started: ${name}`);
  }

  public endTimer(name: string) {
    const startTime = this.performanceMarks.get(name);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`⏱️ Timer ${name}: ${duration.toFixed(2)}ms`);
      this.performanceMarks.delete(name);
      return duration;
    }
    console.warn(`⏱️ Timer ${name} was not started`);
    return null;
  }

  public measureRender(name: string, renderFn: Function) {
    const startTime = performance.now();
    const result = renderFn();
    const duration = performance.now() - startTime;
    console.log(`⏱️ Render ${name}: ${duration.toFixed(2)}ms`);
    return result;
  }

  public logState(state: any, label?: string) {
    const entry = {
      timestamp: Date.now(),
      label: label || 'State',
      state: JSON.parse(JSON.stringify(state)) // Deep clone
    };

    console.group(`🔍 ${entry.label} @ ${new Date(entry.timestamp).toLocaleTimeString()}`);
    console.log(entry.state);
    console.groupEnd();

    return entry;
  }

  public watchState(state: any, callback?: (prev: any, next: any) => void) {
    // Simple state watcher using Proxy
    return new Proxy(state, {
      set: (target: any, property: PropertyKey, value: any) => {
        const prevValue = target[property];
        target[property] = value;
        
        console.log(`🔍 State change: ${String(property)}`, {
          previous: prevValue,
          current: value
        });

        if (callback) {
          callback(prevValue, value);
        }

        return true;
      }
    });
  }

  public getMemoryInfo() {
    const memory = (performance as any).memory;
    if (memory) {
      const info = {
        used: Math.round(memory.usedJSHeapSize / 1048576),
        total: Math.round(memory.totalJSHeapSize / 1048576),
        limit: Math.round(memory.jsHeapSizeLimit / 1048576)
      };
      console.log('💾 Memory Info:', info);
      return info;
    }
    return null;
  }

  public forceGC() {
    if ((window as any).gc) {
      (window as any).gc();
      console.log('🗑️ Garbage collection forced');
    } else {
      console.warn('🗑️ Garbage collection not available');
    }
  }

  public exportLogs() {
    const data = {
      timestamp: Date.now(),
      config: this.config,
      logs: this.logs,
      components: Array.from(this.components.entries()),
      networkRequests: Array.from(this.networkRequests.entries())
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `devtools-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📁 DevTools data exported');
  }

  public clearLogs() {
    this.logs = [];
    this.networkRequests.clear();
    localStorage.removeItem('devtools-logs');
    console.log('🧹 Logs cleared');
  }

  private findReactComponent(element: Element): any {
    const fiberKey = Object.keys(element).find(key => 
      key.startsWith('__reactFiber') || key.startsWith('__reactInternalInstance')
    );
    
    if (fiberKey) {
      return (element as any)[fiberKey];
    }
    
    // Try parent elements
    if (element.parentElement) {
      return this.findReactComponent(element.parentElement);
    }
    
    return null;
  }
}

// Development middleware utilities
export const DevMiddleware = {
  // Request/response logging middleware
  createLoggingMiddleware: () => {
    return (req: any, res: any, next: any) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`🌐 ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
      });
      
      next();
    };
  },

  // Error handling middleware
  createErrorMiddleware: () => {
    return (err: any, req: any, res: any, next: any) => {
      console.error('🚨 Server Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        body: req.body
      });
      
      if (res.headersSent) {
        return next(err);
      }
      
      res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    };
  },

  // Development API endpoints
  createDevEndpoints: (app: any) => {
    // Health check
    app.get('/dev/health', (req: any, res: any) => {
      res.json({
        status: 'ok',
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        env: process.env.NODE_ENV
      });
    });

    // Environment info
    app.get('/dev/info', (req: any, res: any) => {
      res.json({
        node: process.version,
        platform: process.platform,
        arch: process.arch,
        pid: process.pid,
        cwd: process.cwd(),
        env: process.env.NODE_ENV
      });
    });

    // Force garbage collection
    app.post('/dev/gc', (req: any, res: any) => {
      if (global.gc) {
        global.gc();
        res.json({ status: 'gc-forced', memory: process.memoryUsage() });
      } else {
        res.status(400).json({ error: 'GC not available' });
      }
    });
  }
};

// Create default dev tools instance
export const devTools = new DevTools();

export default DevTools;