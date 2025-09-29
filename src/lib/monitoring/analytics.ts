/**
 * User Analytics System
 * Track user interactions, behavior, and engagement metrics
 */

interface UserSession {
  id: string;
  userId?: string | undefined;
  startTime: number;
  endTime?: number | undefined;
  duration?: number | undefined;
  pageViews: number;
  interactions: number;
  referrer: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  location: {
    country?: string | undefined;
    city?: string | undefined;
    timezone: string;
  };
}

interface PageView {
  id: string;
  sessionId: string;
  url: string;
  title: string;
  timestamp: number;
  timeOnPage?: number | undefined;
  exitPage: boolean;
  referrer: string;
  scrollDepth: number;
  engagementTime: number;
}

interface UserEvent {
  id: string;
  sessionId: string;
  type: 'click' | 'scroll' | 'form' | 'search' | 'share' | 'download' | 'error' | 'custom';
  category: string;
  action: string;
  label?: string | undefined;
  value?: number | undefined;
  timestamp: number;
  element?: {
    tagName: string;
    className: string;
    id: string;
    innerText?: string | undefined;
  } | undefined;
  page: {
    url: string;
    title: string;
  };
}

interface ConversionGoal {
  id: string;
  name: string;
  type: 'pageview' | 'event' | 'time' | 'scroll';
  conditions: {
    url?: string | undefined;
    event?: string | undefined;
    timeThreshold?: number | undefined;
    scrollThreshold?: number | undefined;
  };
  value?: number | undefined;
}

interface AnalyticsReport {
  session: UserSession;
  pageViews: PageView[];
  events: UserEvent[];
  conversions: string[];
  performance: {
    avgPageLoadTime: number;
    avgTimeOnPage: number;
    bounceRate: number;
    exitRate: number;
  };
}

export class UserAnalytics {
  private session: UserSession;
  private pageViews: PageView[] = [];
  private events: UserEvent[] = [];
  private conversions: string[] = [];
  private currentPageView: PageView | null = null;
  private isTracking: boolean = false;
  private reportEndpoint: string;
  private sampleRate: number;
  private conversionGoals: ConversionGoal[] = [];
  private engagementTimer: NodeJS.Timeout | null = null;
  private scrollDepthTimer: NodeJS.Timeout | null = null;

  constructor(options: {
    reportEndpoint?: string | undefined;
    sampleRate?: number | undefined;
    userId?: string | undefined;
  } = {}) {
    this.reportEndpoint = options.reportEndpoint || '/api/monitoring/analytics';
    this.sampleRate = options.sampleRate || 1;

    this.session = this.createSession(options.userId);
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;

    // Check sampling
    if (Math.random() > this.sampleRate) return;

    this.isTracking = true;
    console.log('[Analytics] Tracking initialized');

    // Track initial page view
    this.trackPageView();

    // Set up event listeners
    this.setupEventListeners();

    // Set up periodic reporting
    this.setupPeriodicReporting();

    // Set up conversion goals
    this.initializeConversionGoals();
  }

  private createSession(userId?: string | undefined): UserSession {
    return {
      id: this.generateId('session'),
      userId: userId || undefined,
      startTime: Date.now(),
      pageViews: 0,
      interactions: 0,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      location: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  private setupEventListeners() {
    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHidden();
      } else {
        this.handlePageVisible();
      }
    });

    // Before unload
    window.addEventListener('beforeunload', () => {
      this.handlePageUnload();
    });

    // Clicks
    document.addEventListener('click', (event) => {
      this.trackClickEvent(event);
    });

    // Form submissions
    document.addEventListener('submit', (event) => {
      this.trackFormEvent(event);
    });

    // Scroll tracking
    this.setupScrollTracking();

    // Resize tracking
    window.addEventListener('resize', () => {
      this.session.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
    });

    // Error tracking
    window.addEventListener('error', (event) => {
      this.trackEvent('error', 'javascript', event.message, undefined, `${event.filename}:${event.lineno}:${event.colno}`);
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent('error', 'promise', event.reason?.toString() || 'Unhandled Promise Rejection');
    });
  }

  private setupScrollTracking() {
    let maxScrollDepth = 0;
    let scrollTimer: NodeJS.Timeout | null = null;

    const trackScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);

      if (scrollDepth > maxScrollDepth) {
        maxScrollDepth = scrollDepth;
        
        if (this.currentPageView) {
          this.currentPageView.scrollDepth = scrollDepth;
        }

        // Track scroll milestones
        if (scrollDepth >= 25 && scrollDepth < 50) {
          this.trackEvent('scroll', 'milestone', '25%', scrollDepth);
        } else if (scrollDepth >= 50 && scrollDepth < 75) {
          this.trackEvent('scroll', 'milestone', '50%', scrollDepth);
        } else if (scrollDepth >= 75 && scrollDepth < 100) {
          this.trackEvent('scroll', 'milestone', '75%', scrollDepth);
        } else if (scrollDepth >= 100) {
          this.trackEvent('scroll', 'milestone', '100%', scrollDepth);
        }
      }
    };

    window.addEventListener('scroll', () => {
      if (scrollTimer) {
        clearTimeout(scrollTimer);
      }
      scrollTimer = setTimeout(trackScroll, 100);
    });
  }

  private trackClickEvent(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target) return;

    const element = {
      tagName: target.tagName.toLowerCase(),
      className: target.className,
      id: target.id,
      innerText: target.innerText?.slice(0, 100) // Limit text length
    };

    // Determine action based on element
    let action = 'click';
    let category = 'interaction';
    let label = target.tagName.toLowerCase();

    if (target.tagName === 'A') {
      action = 'link_click';
      category = 'navigation';
      label = target.getAttribute('href') || '';
    } else if (target.tagName === 'BUTTON') {
      action = 'button_click';
      category = 'interaction';
      label = target.innerText || target.getAttribute('aria-label') || '';
    } else if (target.closest('form')) {
      action = 'form_interaction';
      category = 'form';
    }

    this.trackEvent('click', category, action, undefined, label, element);
    this.session.interactions++;
  }

  private trackFormEvent(event: SubmitEvent) {
    const form = event.target as HTMLFormElement;
    if (!form) return;

    // Get form field names
    const fields: string[] = [];
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input: any) => {
      if (input.name) fields.push(input.name);
    });

    this.trackEvent('form', 'submission', form.id || form.className || 'unnamed', undefined, fields.join(','));
  }

  public trackPageView(url?: string, title?: string) {
    // End previous page view
    if (this.currentPageView) {
      this.currentPageView.timeOnPage = Date.now() - this.currentPageView.timestamp;
      this.currentPageView.exitPage = false;
    }

    // Create new page view
    const pageView: PageView = {
      id: this.generateId('pageview'),
      sessionId: this.session.id,
      url: url || window.location.href,
      title: title || document.title,
      timestamp: Date.now(),
      exitPage: true, // Will be set to false when next page loads
      referrer: this.currentPageView?.url || document.referrer,
      scrollDepth: 0,
      engagementTime: 0
    };

    this.pageViews.push(pageView);
    this.currentPageView = pageView;
    this.session.pageViews++;

    // Start engagement tracking
    this.startEngagementTracking();

    console.log('[Analytics] Page view tracked:', pageView.url);
  }

  private startEngagementTracking() {
    let engagementTime = 0;
    let isEngaged = !document.hidden;

    if (this.engagementTimer) {
      clearInterval(this.engagementTimer);
    }

    this.engagementTimer = setInterval(() => {
      if (isEngaged && this.currentPageView) {
        engagementTime += 1000; // 1 second
        this.currentPageView.engagementTime = engagementTime;
      }
    }, 1000);

    // Track engagement status
    const handleVisibilityChange = () => {
      isEngaged = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  public trackEvent(
    type: UserEvent['type'], 
    category: string, 
    action: string, 
    value?: number | undefined, 
    label?: string | undefined, 
    element?: UserEvent['element']
  ) {
    if (!this.isTracking) return;

    const event: UserEvent = {
      id: this.generateId('event'),
      sessionId: this.session.id,
      type,
      category,
      action,
      label: label || undefined,
      value: value || undefined,
      timestamp: Date.now(),
      element: element || undefined,
      page: {
        url: window.location.href,
        title: document.title
      }
    };

    this.events.push(event);
    
    // Check for conversions
    this.checkConversions(event);

    console.log('[Analytics] Event tracked:', event.type, event.category, event.action);
  }

  public trackCustomEvent(name: string, data: any = {}) {
    this.trackEvent('custom', 'custom', name, data.value, JSON.stringify(data));
  }

  public trackSearch(query: string, results: number) {
    this.trackEvent('search', 'search', 'query', results, query);
  }

  public trackShare(platform: string, url: string) {
    this.trackEvent('share', 'social', platform, undefined, url);
  }

  public trackDownload(filename: string, size?: number | undefined) {
    this.trackEvent('download', 'file', 'download', size || undefined, filename);
  }

  private initializeConversionGoals() {
    this.conversionGoals = [
      {
        id: 'newsletter_signup',
        name: 'Newsletter Signup',
        type: 'event',
        conditions: { event: 'form_newsletter_submit' },
        value: 5
      },
      {
        id: 'article_read',
        name: 'Article Read',
        type: 'scroll',
        conditions: { scrollThreshold: 75 },
        value: 1
      },
      {
        id: 'engaged_visit',
        name: 'Engaged Visit',
        type: 'time',
        conditions: { timeThreshold: 60000 }, // 1 minute
        value: 2
      }
    ];
  }

  private checkConversions(event: UserEvent) {
    this.conversionGoals.forEach(goal => {
      if (this.conversions.includes(goal.id)) return; // Already converted

      let converted = false;

      switch (goal.type) {
        case 'event':
          if (goal.conditions.event && 
              event.type === 'custom' && 
              event.action === goal.conditions.event) {
            converted = true;
          }
          break;
        case 'scroll':
          if (goal.conditions.scrollThreshold &&
              this.currentPageView &&
              this.currentPageView.scrollDepth >= goal.conditions.scrollThreshold) {
            converted = true;
          }
          break;
        case 'time':
          if (goal.conditions.timeThreshold &&
              this.currentPageView &&
              this.currentPageView.engagementTime >= goal.conditions.timeThreshold) {
            converted = true;
          }
          break;
      }

      if (converted) {
        this.conversions.push(goal.id);
        this.trackEvent('custom', 'conversion', goal.id, goal.value, goal.name);
        console.log('[Analytics] Conversion tracked:', goal.name);
      }
    });
  }

  private handlePageHidden() {
    if (this.currentPageView) {
      this.currentPageView.timeOnPage = Date.now() - this.currentPageView.timestamp;
    }
  }

  private handlePageVisible() {
    // Reset engagement tracking
    this.startEngagementTracking();
  }

  private handlePageUnload() {
    if (this.currentPageView) {
      this.currentPageView.timeOnPage = Date.now() - this.currentPageView.timestamp;
      this.currentPageView.exitPage = true;
    }

    this.session.endTime = Date.now();
    this.session.duration = this.session.endTime - this.session.startTime;

    // Send final report
    this.sendReport(true);
  }

  private setupPeriodicReporting() {
    // Report every 30 seconds
    setInterval(() => {
      if (this.isTracking && !document.hidden) {
        this.sendReport();
      }
    }, 30000);
  }

  private async sendReport(final: boolean = false) {
    const report: AnalyticsReport = {
      session: { ...this.session },
      pageViews: [...this.pageViews],
      events: [...this.events],
      conversions: [...this.conversions],
      performance: this.calculatePerformanceMetrics()
    };

    try {
      const data = JSON.stringify(report);

      if (final && navigator.sendBeacon) {
        navigator.sendBeacon(this.reportEndpoint, data);
      } else {
        await fetch(this.reportEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: data,
          keepalive: true
        });
      }

      console.log('[Analytics] Report sent successfully');

      // Clear sent data (keep session)
      this.pageViews = [];
      this.events = [];

    } catch (error) {
      console.error('[Analytics] Failed to send report:', error);
    }
  }

  private calculatePerformanceMetrics() {
    const pageViewTimes = this.pageViews
      .filter(pv => pv.timeOnPage !== undefined)
      .map(pv => pv.timeOnPage!);

    const avgTimeOnPage = pageViewTimes.length > 0
      ? pageViewTimes.reduce((a, b) => a + b, 0) / pageViewTimes.length
      : 0;

    const bounceRate = this.session.pageViews === 1 ? 1 : 0;
    const exitRate = this.pageViews.filter(pv => pv.exitPage).length / this.pageViews.length;

    return {
      avgPageLoadTime: 0, // Would need performance data
      avgTimeOnPage,
      bounceRate,
      exitRate
    };
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public methods
  public setUserId(userId: string) {
    this.session.userId = userId;
  }

  public addConversionGoal(goal: ConversionGoal) {
    this.conversionGoals.push(goal);
  }

  public getSession(): UserSession {
    return { ...this.session };
  }

  public getReport(): AnalyticsReport {
    return {
      session: { ...this.session },
      pageViews: [...this.pageViews],
      events: [...this.events],
      conversions: [...this.conversions],
      performance: this.calculatePerformanceMetrics()
    };
  }

  public stop() {
    this.isTracking = false;
    
    if (this.engagementTimer) {
      clearInterval(this.engagementTimer);
    }
    
    if (this.scrollDepthTimer) {
      clearTimeout(this.scrollDepthTimer);
    }

    console.log('[Analytics] Tracking stopped');
  }
}

// Singleton instance
export const userAnalytics = new UserAnalytics();

// Analytics utilities
export const AnalyticsUtils = {
  formatDuration: (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },

  calculateEngagementScore: (report: AnalyticsReport): number => {
    let score = 0;
    
    // Time on site
    if (report.session.duration && report.session.duration > 60000) score += 30; // > 1 min
    if (report.session.duration && report.session.duration > 300000) score += 20; // > 5 min
    
    // Page views
    if (report.session.pageViews > 1) score += 20;
    if (report.session.pageViews > 3) score += 20;
    
    // Interactions
    if (report.session.interactions > 5) score += 10;
    
    // Conversions
    score += report.conversions.length * 20;
    
    return Math.min(100, score);
  },

  getTopPages: (pageViews: PageView[]): Array<{ url: string; count: number }> => {
    const pageCounts: { [url: string]: number } = {};
    
    pageViews.forEach(pv => {
      pageCounts[pv.url] = (pageCounts[pv.url] || 0) + 1;
    });
    
    return Object.entries(pageCounts)
      .map(([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  getTopEvents: (events: UserEvent[]): Array<{ action: string; count: number }> => {
    const eventCounts: { [action: string]: number } = {};
    
    events.forEach(event => {
      const key = `${event.category}:${event.action}`;
      eventCounts[key] = (eventCounts[key] || 0) + 1;
    });
    
    return Object.entries(eventCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
};

export default userAnalytics;