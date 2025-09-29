/**
 * Tests for User Analytics System
 */

import { UserAnalytics, AnalyticsUtils } from '../analytics';

// Mock DOM elements and events
const mockDocument = {
  referrer: 'https://google.com',
  title: 'Test Page',
  hidden: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockWindow = {
  location: {
    href: 'https://example.com/test',
    pathname: '/test'
  },
  innerWidth: 1920,
  innerHeight: 1080,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

const mockNavigator = {
  userAgent: 'Test User Agent',
  sendBeacon: jest.fn(() => true)
};

const mockFetch = jest.fn(() => Promise.resolve({
  ok: true,
  status: 200,
  json: () => Promise.resolve({ success: true })
}));

// Setup global mocks
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
});

Object.defineProperty(global, 'window', {
  value: mockWindow,
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

// Mock Intl for timezone
Object.defineProperty(global, 'Intl', {
  value: {
    DateTimeFormat: jest.fn(() => ({
      resolvedOptions: () => ({ timeZone: 'Europe/Istanbul' })
    }))
  },
  writable: true
});

describe('UserAnalytics', () => {
  let analytics: UserAnalytics;

  beforeEach(() => {
    jest.clearAllMocks();
    analytics = new UserAnalytics({
      reportEndpoint: '/api/test-analytics',
      sampleRate: 1,
      userId: 'test-user-123'
    });
  });

  afterEach(() => {
    analytics.stop();
  });

  describe('Initialization', () => {
    it('should create analytics instance', () => {
      expect(analytics).toBeInstanceOf(UserAnalytics);
    });

    it('should create session with correct data', () => {
      const session = analytics.getSession();
      
      expect(session).toEqual({
        id: expect.stringMatching(/^session_/),
        userId: 'test-user-123',
        startTime: expect.any(Number),
        pageViews: expect.any(Number),
        interactions: 0,
        referrer: 'https://google.com',
        userAgent: 'Test User Agent',
        viewport: { width: 1920, height: 1080 },
        location: { timezone: 'Europe/Istanbul' }
      });
    });

    it('should set up event listeners', () => {
      expect(mockDocument.addEventListener).toHaveBeenCalled();
      expect(mockWindow.addEventListener).toHaveBeenCalled();
    });

    it('should respect sampling rate', () => {
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.9);
      
      // 50% sampling should not track
      const analytics2 = new UserAnalytics({ sampleRate: 0.5 });
      expect(analytics2).toBeDefined();
      
      Math.random = originalRandom;
    });
  });

  describe('Page Views', () => {
    it('should track page views automatically', () => {
      const session = analytics.getSession();
      expect(session.pageViews).toBeGreaterThanOrEqual(1);
    });

    it('should track custom page views', () => {
      analytics.trackPageView('/custom-page', 'Custom Page Title');
      
      const session = analytics.getSession();
      expect(session.pageViews).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Events', () => {
    it('should track custom events', () => {
      analytics.trackEvent('click', 'button', 'signup', 1, 'Sign Up Button');
      
      // Events are included in the report
      const report = analytics.getReport();
      const clickEvents = report.events.filter(e => e.type === 'click');
      expect(clickEvents).toHaveLength(1);
      expect(clickEvents[0]).toEqual({
        id: expect.stringMatching(/^event_/),
        sessionId: expect.any(String),
        type: 'click',
        category: 'button',
        action: 'signup',
        label: 'Sign Up Button',
        value: 1,
        timestamp: expect.any(Number),
        element: undefined,
        page: {
          url: 'https://example.com/test',
          title: 'Test Page'
        }
      });
    });

    it('should track search events', () => {
      analytics.trackSearch('trabzonspor haberler', 25);
      
      const report = analytics.getReport();
      const searchEvents = report.events.filter(e => e.type === 'search');
      expect(searchEvents).toHaveLength(1);
      expect(searchEvents[0].value).toBe(25);
      expect(searchEvents[0].label).toBe('trabzonspor haberler');
    });

    it('should track share events', () => {
      analytics.trackShare('twitter', 'https://example.com/article');
      
      const report = analytics.getReport();
      const shareEvents = report.events.filter(e => e.type === 'share');
      expect(shareEvents).toHaveLength(1);
      expect(shareEvents[0].action).toBe('twitter');
    });

    it('should track download events', () => {
      analytics.trackDownload('report.pdf', 1024000);
      
      const report = analytics.getReport();
      const downloadEvents = report.events.filter(e => e.type === 'download');
      expect(downloadEvents).toHaveLength(1);
      expect(downloadEvents[0].value).toBe(1024000);
    });

    it('should track custom events', () => {
      analytics.trackCustomEvent('newsletter_signup', { source: 'footer' });
      
      const report = analytics.getReport();
      const customEvents = report.events.filter(e => e.type === 'custom');
      expect(customEvents).toHaveLength(1);
      expect(customEvents[0].action).toBe('newsletter_signup');
    });
  });

  describe('Conversions', () => {
    it('should track conversions when goals are met', () => {
      // Add a custom conversion goal
      analytics.addConversionGoal({
        id: 'test_goal',
        name: 'Test Goal',
        type: 'event',
        conditions: { event: 'test_action' },
        value: 10
      });

      // Trigger the goal
      analytics.trackCustomEvent('test_action');

      const report = analytics.getReport();
      expect(report.conversions).toContain('test_goal');
    });
  });

  describe('User Context', () => {
    it('should set user ID', () => {
      analytics.setUserId('new-user-456');
      
      const session = analytics.getSession();
      expect(session.userId).toBe('new-user-456');
    });

    it('should update session with user interactions', () => {
      // Simulate a click event
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true
      });

      Object.defineProperty(clickEvent, 'target', {
        value: {
          tagName: 'BUTTON',
          className: 'btn btn-primary',
          id: 'signup-btn',
          innerText: 'Sign Up'
        },
        writable: false
      });

      // Trigger click handler
      const clickHandler = mockDocument.addEventListener.mock.calls
        .find(call => call[0] === 'click')?.[1];
      
      if (clickHandler) {
        clickHandler(clickEvent);
      }

      const session = analytics.getSession();
      expect(session.interactions).toBeGreaterThan(0);
    });
  });

  describe('Reporting', () => {
    it('should generate comprehensive report', () => {
      analytics.trackEvent('click', 'button', 'test');
      
      const report = analytics.getReport();
      
      expect(report).toEqual({
        session: expect.any(Object),
        pageViews: expect.any(Array),
        events: expect.any(Array),
        conversions: expect.any(Array),
        performance: expect.any(Object)
      });

      expect(report.performance).toEqual({
        avgPageLoadTime: expect.any(Number),
        avgTimeOnPage: expect.any(Number),
        bounceRate: expect.any(Number),
        exitRate: expect.any(Number)
      });
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      
      // Should not throw
      expect(() => analytics.getReport()).not.toThrow();
    });
  });

  describe('Control Methods', () => {
    it('should stop tracking', () => {
      analytics.stop();
      // Should not track events after stop
      analytics.trackEvent('click', 'button', 'test');
      
      const report = analytics.getReport();
      const clickEvents = report.events.filter(e => e.type === 'click');
      expect(clickEvents).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing window', () => {
      const originalWindow = global.window;
      delete (global as any).window;
      
      expect(() => {
        new UserAnalytics();
      }).not.toThrow();
      
      global.window = originalWindow;
    });

    it('should handle missing document', () => {
      const originalDocument = global.document;
      delete (global as any).document;
      
      expect(() => {
        new UserAnalytics();
      }).not.toThrow();
      
      global.document = originalDocument;
    });
  });
});

describe('AnalyticsUtils', () => {
  describe('formatDuration', () => {
    it('should format milliseconds to readable duration', () => {
      expect(AnalyticsUtils.formatDuration(1000)).toBe('1s');
      expect(AnalyticsUtils.formatDuration(60000)).toBe('1m 0s');
      expect(AnalyticsUtils.formatDuration(3600000)).toBe('1h 0m 0s');
      expect(AnalyticsUtils.formatDuration(3661000)).toBe('1h 1m 1s');
    });
  });

  describe('calculateEngagementScore', () => {
    it('should calculate engagement score', () => {
      const report = {
        session: {
          duration: 300000, // 5 minutes
          pageViews: 3,
          interactions: 10
        },
        conversions: ['goal1', 'goal2']
      } as any;

      const score = AnalyticsUtils.calculateEngagementScore(report);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('getTopPages', () => {
    it('should return top pages by view count', () => {
      const pageViews = [
        { url: '/page1' },
        { url: '/page2' },
        { url: '/page1' },
        { url: '/page3' },
        { url: '/page1' }
      ] as any[];

      const topPages = AnalyticsUtils.getTopPages(pageViews);
      
      expect(topPages).toHaveLength(3);
      expect(topPages[0]).toEqual({ url: '/page1', count: 3 });
      expect(topPages[1]).toEqual({ url: '/page2', count: 1 });
    });
  });

  describe('getTopEvents', () => {
    it('should return top events by count', () => {
      const events = [
        { category: 'button', action: 'click' },
        { category: 'form', action: 'submit' },
        { category: 'button', action: 'click' },
        { category: 'link', action: 'click' }
      ] as any[];

      const topEvents = AnalyticsUtils.getTopEvents(events);
      
      expect(topEvents).toHaveLength(3);
      expect(topEvents[0]).toEqual({ action: 'button:click', count: 2 });
    });
  });
});