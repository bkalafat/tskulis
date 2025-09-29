/**
 * Tests for Error Reporting System
 */

import { ErrorReportingSystem, ErrorUtils } from '../errors';

// Mock DOM and global objects
const mockFetch = jest.fn(() => Promise.resolve({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true })
}));

const mockNavigator = {
  userAgent: 'Test User Agent'
};

const mockWindow = {
  location: { href: 'https://example.com/test' },
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  fetch: mockFetch
};

const mockDocument = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockConsole = {
  error: jest.fn(),
  warn: jest.fn(),
  log: jest.fn()
};

// Setup global mocks
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
});

Object.defineProperty(global, 'document', {
  value: mockDocument,
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

Object.defineProperty(global, 'console', {
  value: mockConsole,
  writable: true
});

describe('ErrorReportingSystem', () => {
  let errorReporting: ErrorReportingSystem;

  beforeEach(() => {
    jest.clearAllMocks();
    errorReporting = new ErrorReportingSystem({
      reportEndpoint: '/api/test-errors',
      maxBreadcrumbs: 10,
      maxErrors: 20,
      userId: 'test-user-123',
      sessionId: 'test-session-456'
    });
  });

  afterEach(() => {
    errorReporting.disable();
  });

  describe('Initialization', () => {
    it('should create error reporting instance', () => {
      expect(errorReporting).toBeInstanceOf(ErrorReportingSystem);
    });

    it('should set up error listeners', () => {
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    });

    it('should intercept console methods', () => {
      expect(console.error).toBeDefined();
      expect(console.warn).toBeDefined();
    });

    it('should be enabled by default', () => {
      expect(errorReporting.isErrorReportingEnabled()).toBe(true);
    });
  });

  describe('Error Capture', () => {
    it('should capture custom errors', () => {
      errorReporting.captureError({
        type: 'custom',
        message: 'Test error message',
        severity: 'high',
        tags: ['test', 'custom']
      });

      const errors = errorReporting.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0]).toEqual({
        id: expect.stringMatching(/^error_/),
        timestamp: expect.any(Number),
        type: 'custom',
        message: 'Test error message',
        stack: undefined,
        url: 'https://example.com/test',
        userAgent: 'Test User Agent',
        userId: 'test-user-123',
        sessionId: 'test-session-456',
        severity: 'high',
        context: undefined,
        fingerprint: expect.any(String),
        count: 1,
        resolved: false,
        tags: ['test', 'custom'],
        breadcrumbs: expect.any(Array)
      });
    });

    it('should capture JavaScript exceptions', () => {
      const testError = new Error('Test exception');
      testError.stack = 'Error: Test exception\n    at test.js:1:1';

      errorReporting.captureException(testError, {
        component: 'TestComponent',
        action: 'handleClick'
      });

      const errors = errorReporting.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('javascript');
      expect(errors[0].message).toBe('Test exception');
      expect(errors[0].stack).toBe('Error: Test exception\n    at test.js:1:1');
      expect(errors[0].context).toEqual({
        component: 'TestComponent',
        action: 'handleClick'
      });
    });

    it('should capture API errors', () => {
      const mockResponse = {
        status: 500,
        statusText: 'Internal Server Error',
        url: 'https://api.example.com/data'
      } as Response;

      errorReporting.captureAPIError(mockResponse, { requestId: '123' });

      const errors = errorReporting.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('api');
      expect(errors[0].severity).toBe('critical');
      expect(errors[0].tags).toContain('api');
      expect(errors[0].tags).toContain('http');
    });

    it('should capture React errors', () => {
      const reactError = new Error('React component error');
      const errorInfo = { componentStack: '\n    in ErrorComponent\n    in App' };

      errorReporting.captureReactError(reactError, errorInfo);

      const errors = errorReporting.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].type).toBe('react');
      expect(errors[0].tags).toContain('react');
      expect(errors[0].tags).toContain('component');
      expect(errors[0].context?.additional?.componentStack).toBe(errorInfo.componentStack);
    });

    it('should deduplicate similar errors', () => {
      // Capture the same error twice
      const error1 = {
        message: 'Same error',
        stack: 'Error: Same error\n    at test.js:1:1'
      };

      errorReporting.captureError(error1);
      errorReporting.captureError(error1);

      const errors = errorReporting.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].count).toBe(2);
    });

    it('should limit error count', () => {
      // Create instance with small limit
      const limitedReporting = new ErrorReportingSystem({
        maxErrors: 2
      });

      // Add more errors than limit
      limitedReporting.captureError({ message: 'Error 1' });
      limitedReporting.captureError({ message: 'Error 2' });
      limitedReporting.captureError({ message: 'Error 3' });

      const errors = limitedReporting.getErrors();
      expect(errors).toHaveLength(2);
      // Should keep the most recent errors
      expect(errors.some(e => e.message === 'Error 2')).toBe(true);
      expect(errors.some(e => e.message === 'Error 3')).toBe(true);
    });
  });

  describe('Breadcrumbs', () => {
    it('should add breadcrumbs', () => {
      errorReporting.addBreadcrumb({
        type: 'user',
        category: 'click',
        message: 'User clicked button',
        data: { buttonId: 'submit' },
        level: 'info'
      });

      const breadcrumbs = errorReporting.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0]).toEqual({
        timestamp: expect.any(Number),
        type: 'user',
        category: 'click',
        message: 'User clicked button',
        data: { buttonId: 'submit' },
        level: 'info'
      });
    });

    it('should add user action breadcrumbs', () => {
      errorReporting.addUserBreadcrumb('login_attempt', { email: 'test@example.com' });

      const breadcrumbs = errorReporting.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].type).toBe('user');
      expect(breadcrumbs[0].message).toBe('login_attempt');
    });

    it('should add navigation breadcrumbs', () => {
      errorReporting.addNavigationBreadcrumb('/dashboard');

      const breadcrumbs = errorReporting.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(1);
      expect(breadcrumbs[0].type).toBe('navigation');
      expect(breadcrumbs[0].data?.url).toBe('/dashboard');
    });

    it('should limit breadcrumb count', () => {
      // Add more breadcrumbs than limit
      for (let i = 0; i < 15; i++) {
        errorReporting.addBreadcrumb({
          type: 'user',
          category: 'test',
          message: `Breadcrumb ${i}`
        });
      }

      const breadcrumbs = errorReporting.getBreadcrumbs();
      expect(breadcrumbs).toHaveLength(10); // maxBreadcrumbs = 10
    });
  });

  describe('Error Statistics', () => {
    it('should generate error statistics', () => {
      // Add various errors
      errorReporting.captureError({ type: 'javascript', message: 'JS Error', severity: 'high' });
      errorReporting.captureError({ type: 'network', message: 'Network Error', severity: 'medium' });
      errorReporting.captureError({ type: 'javascript', message: 'Another JS Error', severity: 'low' });

      const stats = errorReporting.getErrorStats();

      expect(stats.total).toBe(3);
      expect(stats.byType.javascript).toBe(2);
      expect(stats.byType.network).toBe(1);
      expect(stats.bySeverity.high).toBe(1);
      expect(stats.bySeverity.medium).toBe(1);
      expect(stats.bySeverity.low).toBe(1);
      expect(stats.mostCommon).toHaveLength(3);
      expect(stats.recentErrors).toHaveLength(3);
    });

    it('should identify most common errors', () => {
      // Create multiple instances of the same error
      for (let i = 0; i < 5; i++) {
        errorReporting.captureError({
          message: 'Common error',
          stack: 'Error: Common error\n    at test.js:1:1'
        });
      }

      errorReporting.captureError({ message: 'Rare error' });

      const stats = errorReporting.getErrorStats();
      expect(stats.mostCommon[0].count).toBe(5);
      expect(stats.mostCommon[0].message).toBe('Common error');
    });
  });

  describe('Network Interception', () => {
    it('should intercept fetch errors', async () => {
      // Mock fetch to throw error
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network failed'));

      try {
        await fetch('https://api.example.com/data');
      } catch (error) {
        // Error should be captured automatically
      }

      // Allow time for async error handling
      await new Promise(resolve => setTimeout(resolve, 0));

      const errors = errorReporting.getErrors();
      const networkErrors = errors.filter(e => e.type === 'network');
      expect(networkErrors.length).toBeGreaterThan(0);

      // Restore original fetch
      global.fetch = originalFetch;
    });
  });

  describe('Reporting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should send batch reports', async () => {
      errorReporting.captureError({ message: 'Test error 1' });
      errorReporting.captureError({ message: 'Test error 2' });

      await errorReporting.sendBatchReport();

      expect(mockFetch).toHaveBeenCalledWith('/api/test-errors/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('Test error 1')
      });
    });

    it('should handle reporting errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      errorReporting.captureError({ message: 'Test error' });

      // Should not throw
      await expect(errorReporting.sendBatchReport()).resolves.not.toThrow();
    });
  });

  describe('Control Methods', () => {
    it('should enable and disable reporting', () => {
      expect(errorReporting.isErrorReportingEnabled()).toBe(true);

      errorReporting.disable();
      expect(errorReporting.isErrorReportingEnabled()).toBe(false);

      errorReporting.enable();
      expect(errorReporting.isErrorReportingEnabled()).toBe(true);
    });

    it('should not capture errors when disabled', () => {
      errorReporting.disable();
      errorReporting.captureError({ message: 'Should not be captured' });

      const errors = errorReporting.getErrors();
      expect(errors).toHaveLength(0);
    });

    it('should clear errors and breadcrumbs', () => {
      errorReporting.captureError({ message: 'Test error' });
      errorReporting.addBreadcrumb({ type: 'user', category: 'test', message: 'Test breadcrumb' });

      errorReporting.clearErrors();
      errorReporting.clearBreadcrumbs();

      expect(errorReporting.getErrors()).toHaveLength(0);
      expect(errorReporting.getBreadcrumbs()).toHaveLength(0);
    });

    it('should update context', () => {
      errorReporting.setContext({
        userId: 'new-user-789',
        sessionId: 'new-session-abc'
      });

      errorReporting.captureError({ message: 'Test error' });

      const errors = errorReporting.getErrors();
      expect(errors[0].userId).toBe('new-user-789');
      expect(errors[0].sessionId).toBe('new-session-abc');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing window object', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        new ErrorReportingSystem();
      }).not.toThrow();

      global.window = originalWindow;
    });

    it('should handle circular references in context', () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        errorReporting.captureError({
          message: 'Test error',
          context: { additional: circularObj }
        });
      }).not.toThrow();
    });
  });
});

describe('ErrorUtils', () => {
  const sampleErrors = [
    {
      id: '1',
      type: 'javascript' as const,
      message: 'JS Error',
      severity: 'high' as const,
      fingerprint: 'fp1'
    },
    {
      id: '2',
      type: 'network' as const,
      message: 'Network Error',
      severity: 'medium' as const,
      fingerprint: 'fp2'
    },
    {
      id: '3',
      type: 'javascript' as const,
      message: 'Another JS Error',
      severity: 'low' as const,
      fingerprint: 'fp3'
    }
  ] as any[];

  describe('formatError', () => {
    it('should format error for display', () => {
      const formatted = ErrorUtils.formatError(sampleErrors[0]);
      expect(formatted).toBe('[HIGH] javascript: JS Error');
    });
  });

  describe('getErrorsByType', () => {
    it('should filter errors by type', () => {
      const jsErrors = ErrorUtils.getErrorsByType(sampleErrors, 'javascript');
      expect(jsErrors).toHaveLength(2);
      expect(jsErrors.every(e => e.type === 'javascript')).toBe(true);
    });
  });

  describe('getErrorsBySeverity', () => {
    it('should filter errors by severity', () => {
      const highErrors = ErrorUtils.getErrorsBySeverity(sampleErrors, 'high');
      expect(highErrors).toHaveLength(1);
      expect(highErrors[0].severity).toBe('high');
    });
  });

  describe('getRecentErrors', () => {
    it('should filter recent errors', () => {
      const now = Date.now();
      const recentErrors = [
        { ...sampleErrors[0], timestamp: now - 30 * 60 * 1000 }, // 30 minutes ago
        { ...sampleErrors[1], timestamp: now - 90 * 60 * 1000 }, // 90 minutes ago
      ] as any[];

      const recent = ErrorUtils.getRecentErrors(recentErrors, 60); // Last 60 minutes
      expect(recent).toHaveLength(1);
    });
  });

  describe('groupErrorsByFingerprint', () => {
    it('should group errors by fingerprint', () => {
      const errorsWithSameFingerprint = [
        { ...sampleErrors[0], fingerprint: 'same-fp' },
        { ...sampleErrors[1], fingerprint: 'same-fp' },
        { ...sampleErrors[2], fingerprint: 'different-fp' }
      ] as any[];

      const groups = ErrorUtils.groupErrorsByFingerprint(errorsWithSameFingerprint);

      expect(Object.keys(groups)).toHaveLength(2);
      expect(groups['same-fp']).toHaveLength(2);
      expect(groups['different-fp']).toHaveLength(1);
    });
  });
});