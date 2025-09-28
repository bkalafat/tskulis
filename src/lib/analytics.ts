/**
 * Advanced Analytics Integration for TS Kulis
 * Google Analytics 4, GTM, and custom event tracking
 */

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    fbq: (...args: any[]) => void;
  }
}

// Analytics configuration
export const ANALYTICS_CONFIG = {
  GA4_ID: process.env.NEXT_PUBLIC_GA_TRACKING_ID || '',
  GTM_ID: process.env.NEXT_PUBLIC_GTM_ID || '',
  FB_PIXEL_ID: process.env.NEXT_PUBLIC_FB_PIXEL_ID || '',
  HOTJAR_ID: process.env.NEXT_PUBLIC_HOTJAR_ID || '',
  enabled: process.env.NODE_ENV === 'production',
  debug: process.env.NODE_ENV === 'development',
};

// Enhanced eCommerce events for content tracking
export interface ContentEvent {
  event_category: 'content';
  event_label?: string;
  content_title?: string;
  content_category?: string;
  content_id?: string;
  content_type?: 'article' | 'category' | 'homepage';
  author?: string;
  publish_date?: string;
  word_count?: number;
  reading_time?: number;
}

// User engagement events
export interface EngagementEvent {
  event_category: 'engagement';
  event_label?: string;
  engagement_time?: number;
  scroll_depth?: number;
  click_element?: string;
  form_interaction?: string;
}

// Performance events
export interface PerformanceEvent {
  event_category: 'performance';
  event_label?: string;
  page_load_time?: number;
  dom_content_loaded?: number;
  first_contentful_paint?: number;
  largest_contentful_paint?: number;
  cumulative_layout_shift?: number;
}

type AnalyticsEvent = ContentEvent | EngagementEvent | PerformanceEvent;

class AnalyticsManager {
  private initialized = false;
  private eventQueue: AnalyticsEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeAnalytics();
    }
  }

  // Initialize all analytics services
  private async initializeAnalytics() {
    if (!ANALYTICS_CONFIG.enabled) {
      console.log('[Analytics] Analytics disabled in development mode');
      return;
    }

    try {
      // Initialize Google Analytics 4
      if (ANALYTICS_CONFIG.GA4_ID) {
        await this.initializeGA4();
      }

      // Initialize Google Tag Manager
      if (ANALYTICS_CONFIG.GTM_ID) {
        await this.initializeGTM();
      }

      // Initialize Facebook Pixel
      if (ANALYTICS_CONFIG.FB_PIXEL_ID) {
        await this.initializeFacebookPixel();
      }

      // Initialize Hotjar
      if (ANALYTICS_CONFIG.HOTJAR_ID) {
        await this.initializeHotjar();
      }

      this.initialized = true;
      this.flushEventQueue();

      // Set up automatic event tracking
      this.setupAutomaticTracking();

      console.log('[Analytics] All analytics services initialized');
    } catch (error) {
      console.error('[Analytics] Initialization error:', error);
    }
  }

  // Initialize Google Analytics 4
  private async initializeGA4() {
    if (!ANALYTICS_CONFIG.GA4_ID) return;

    // Load GA4 script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.GA4_ID}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: any[]) {
      window.dataLayer.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', ANALYTICS_CONFIG.GA4_ID, {
      page_title: document.title,
      page_location: window.location.href,
      send_page_view: true,
      // Enhanced eCommerce
      enhanced_ecommerce: true,
      // Custom parameters for news site
      custom_map: {
        custom_parameter_1: 'content_category',
        custom_parameter_2: 'author',
        custom_parameter_3: 'publish_date'
      }
    });

    // Set user properties
    this.setUserProperties();
  }

  // Initialize Google Tag Manager
  private async initializeGTM() {
    if (!ANALYTICS_CONFIG.GTM_ID) return;

    // GTM script
    const script = document.createElement('script');
    script.innerHTML = `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
      new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
      j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
      'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','${ANALYTICS_CONFIG.GTM_ID}');
    `;
    document.head.appendChild(script);

    // GTM noscript fallback
    const noscript = document.createElement('noscript');
    noscript.innerHTML = `<iframe src="https://www.googletagmanager.com/ns.html?id=${ANALYTICS_CONFIG.GTM_ID}"
      height="0" width="0" style="display:none;visibility:hidden"></iframe>`;
    document.body.appendChild(noscript);
  }

  // Initialize Facebook Pixel
  private async initializeFacebookPixel() {
    if (!ANALYTICS_CONFIG.FB_PIXEL_ID) return;

    // Facebook Pixel script
    const script = document.createElement('script');
    script.innerHTML = `
      !function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
    `;
    document.head.appendChild(script);

    window.fbq('init', ANALYTICS_CONFIG.FB_PIXEL_ID);
    window.fbq('track', 'PageView');
  }

  // Initialize Hotjar
  private async initializeHotjar() {
    if (!ANALYTICS_CONFIG.HOTJAR_ID) return;

    const script = document.createElement('script');
    script.innerHTML = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${ANALYTICS_CONFIG.HOTJAR_ID},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;
    document.head.appendChild(script);
  }

  // Set user properties for better segmentation
  private setUserProperties() {
    if (!window.gtag) return;

    const userProperties = {
      device_type: this.getDeviceType(),
      connection_type: this.getConnectionType(),
      browser_language: navigator.language,
      screen_resolution: `${screen.width}x${screen.height}`,
      viewport_size: `${window.innerWidth}x${window.innerHeight}`,
      time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    window.gtag('config', ANALYTICS_CONFIG.GA4_ID, {
      custom_map: userProperties
    });
  }

  // Setup automatic event tracking
  private setupAutomaticTracking() {
    // Scroll depth tracking
    this.setupScrollTracking();
    
    // Click tracking for important elements
    this.setupClickTracking();
    
    // Form interaction tracking
    this.setupFormTracking();
    
    // Error tracking
    this.setupErrorTracking();
    
    // Performance tracking
    this.setupPerformanceTracking();
  }

  // Scroll depth tracking
  private setupScrollTracking() {
    let maxScroll = 0;
    const milestones = [25, 50, 75, 100];
    const tracked = new Set<number>();

    const trackScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScroll = Math.max(maxScroll, scrollPercent);
      
      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !tracked.has(milestone)) {
          tracked.add(milestone);
          this.trackEvent('scroll_depth', {
            event_category: 'engagement',
            event_label: `${milestone}%`,
            scroll_depth: milestone,
          });
        }
      });
    };

    window.addEventListener('scroll', this.debounce(trackScroll, 100));
    
    // Track final scroll depth on page leave
    window.addEventListener('beforeunload', () => {
      this.trackEvent('max_scroll_depth', {
        event_category: 'engagement',
        event_label: `${maxScroll}%`,
        scroll_depth: maxScroll,
      });
    });
  }

  // Click tracking for important elements
  private setupClickTracking() {
    const trackedSelectors = [
      'a[href^="mailto:"]',
      'a[href^="tel:"]',
      'a[href*="twitter.com"]',
      'a[href*="facebook.com"]',
      'a[href*="instagram.com"]',
      '.share-button',
      '.category-link',
      '.article-link',
      '.header-logo'
    ];

    trackedSelectors.forEach(selector => {
      document.addEventListener('click', (e) => {
        const target = e.target as Element;
        if (target.matches(selector)) {
          this.trackEvent('click', {
            event_category: 'engagement',
            event_label: selector,
            click_element: target.textContent?.trim() || selector,
          });
        }
      });
    });
  }

  // Form interaction tracking
  private setupFormTracking() {
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        this.trackEvent('form_interaction', {
          event_category: 'engagement',
          event_label: 'form_field_focus',
          form_interaction: target.name || target.id || 'unknown_field',
        });
      }
    });

    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      this.trackEvent('form_submit', {
        event_category: 'engagement',
        event_label: 'form_submission',
        form_interaction: form.name || form.id || 'unknown_form',
      });
    });
  }

  // Error tracking
  private setupErrorTracking() {
    window.addEventListener('error', (e) => {
      this.trackEvent('javascript_error', {
        event_category: 'error',
        event_label: e.message,
        error_message: e.message,
        error_filename: e.filename,
        error_line: e.lineno,
      } as any);
    });

    window.addEventListener('unhandledrejection', (e) => {
      this.trackEvent('promise_rejection', {
        event_category: 'error',
        event_label: e.reason?.toString() || 'Unknown promise rejection',
        error_message: e.reason?.toString(),
      } as any);
    });
  }

  // Performance tracking
  private setupPerformanceTracking() {
    // Track Core Web Vitals
    if ('PerformanceObserver' in window) {
      try {
        // Track LCP
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.trackEvent('largest_contentful_paint', {
            event_category: 'performance',
            event_label: 'lcp',
            largest_contentful_paint: Math.round(lastEntry.startTime),
          });
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // Track CLS
        new PerformanceObserver((list) => {
          let clsValue = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
            }
          }
          if (clsValue > 0) {
            this.trackEvent('cumulative_layout_shift', {
              event_category: 'performance',
              event_label: 'cls',
              cumulative_layout_shift: Math.round(clsValue * 1000) / 1000,
            });
          }
        }).observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('[Analytics] Performance Observer not supported:', error);
      }
    }

    // Track page load time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.trackEvent('page_load_time', {
            event_category: 'performance',
            event_label: 'load_timing',
            page_load_time: Math.round(navigation.loadEventEnd - navigation.fetchStart),
            dom_content_loaded: Math.round(navigation.domContentLoadedEventEnd - navigation.fetchStart),
          });
        }
      }, 0);
    });
  }

  // Track custom events
  public trackEvent(eventName: string, parameters: AnalyticsEvent) {
    if (!this.initialized) {
      this.eventQueue.push(parameters);
      return;
    }

    try {
      // Google Analytics 4
      if (window.gtag && ANALYTICS_CONFIG.GA4_ID) {
        window.gtag('event', eventName, parameters);
      }

      // Facebook Pixel
      if (window.fbq && ANALYTICS_CONFIG.FB_PIXEL_ID) {
        window.fbq('trackCustom', eventName, parameters);
      }

      // Debug logging
      if (ANALYTICS_CONFIG.debug) {
        console.log('[Analytics] Event tracked:', eventName, parameters);
      }
    } catch (error) {
      console.error('[Analytics] Event tracking error:', error);
    }
  }

  // Track page views
  public trackPageView(url: string, title?: string) {
    if (!this.initialized) return;

    const pageData = {
      page_title: title || document.title,
      page_location: url,
    };

    try {
      // Google Analytics
      if (window.gtag) {
        window.gtag('config', ANALYTICS_CONFIG.GA4_ID, pageData);
      }

      // Facebook Pixel
      if (window.fbq) {
        window.fbq('track', 'PageView');
      }

      if (ANALYTICS_CONFIG.debug) {
        console.log('[Analytics] Page view tracked:', pageData);
      }
    } catch (error) {
      console.error('[Analytics] Page view tracking error:', error);
    }
  }

  // Track content interactions
  public trackContentInteraction(action: string, contentData: {
    title?: string;
    category?: string;
    id?: string;
    author?: string;
  }) {
    this.trackEvent(action, {
      event_category: 'content',
      event_label: action,
      content_title: contentData.title,
      content_category: contentData.category,
      content_id: contentData.id,
      author: contentData.author,
    } as ContentEvent);
  }

  // Flush queued events
  private flushEventQueue() {
    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();
      if (event) {
        this.trackEvent('queued_event', event);
      }
    }
  }

  // Utility functions
  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  private getConnectionType(): string {
    const nav = navigator as any;
    if (nav.connection) {
      return nav.connection.effectiveType || 'unknown';
    }
    return 'unknown';
  }

  private debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

// Export singleton instance
export const analytics = new AnalyticsManager();

// React hook for analytics
export const useAnalytics = () => {
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackPageView: analytics.trackPageView.bind(analytics),
    trackContentInteraction: analytics.trackContentInteraction.bind(analytics),
  };
};