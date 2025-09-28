/**
 * Performance Budget Configuration for TS Kulis
 * 
 * This file defines performance budgets and thresholds for the application.
 * These budgets help ensure optimal performance across different metrics.
 */

module.exports = {
  // Bundle size budgets (in bytes)
  bundles: {
    // Main application bundle
    'pages/_app': {
      maxSize: 250000, // 250KB
      warning: 200000, // 200KB
    },
    // Homepage bundle
    'pages/index': {
      maxSize: 100000, // 100KB
      warning: 80000,  // 80KB
    },
    // Category pages
    'pages/[category]': {
      maxSize: 120000, // 120KB
      warning: 100000, // 100KB
    },
    // Article pages
    'pages/[category]/[slug]': {
      maxSize: 150000, // 150KB
      warning: 120000, // 120KB
    },
    // Admin panel
    'pages/adminpanel': {
      maxSize: 300000, // 300KB (larger due to CKEditor)
      warning: 250000, // 250KB
    },
    // Editor pages
    'pages/editor/[id]': {
      maxSize: 400000, // 400KB (CKEditor + admin features)
      warning: 350000, // 350KB
    }
  },

  // Asset size budgets
  assets: {
    // JavaScript total size
    js: {
      maxSize: 800000,  // 800KB total JS
      warning: 600000,  // 600KB warning
    },
    // CSS total size
    css: {
      maxSize: 200000,  // 200KB total CSS
      warning: 150000,  // 150KB warning
    },
    // Images total size per page
    images: {
      maxSize: 1000000, // 1MB total images per page
      warning: 800000,  // 800KB warning
    },
    // Fonts total size
    fonts: {
      maxSize: 300000,  // 300KB total fonts
      warning: 200000,  // 200KB warning
    }
  },

  // Performance timing budgets (in milliseconds)
  timing: {
    // First Contentful Paint
    FCP: {
      good: 1800,    // 1.8 seconds
      warning: 3000, // 3 seconds
    },
    // Largest Contentful Paint
    LCP: {
      good: 2500,    // 2.5 seconds
      warning: 4000, // 4 seconds
    },
    // Time to Interactive
    TTI: {
      good: 3800,    // 3.8 seconds
      warning: 7300, // 7.3 seconds
    },
    // First Input Delay
    FID: {
      good: 100,     // 100ms
      warning: 300,  // 300ms
    },
    // Cumulative Layout Shift
    CLS: {
      good: 0.1,     // 0.1
      warning: 0.25, // 0.25
    }
  },

  // Network condition budgets
  network: {
    // Slow 3G simulation
    slow3G: {
      downloadSpeed: 500,    // 500 Kbps
      uploadSpeed: 500,      // 500 Kbps
      latency: 400,          // 400ms
      maxLoadTime: 10000,    // 10 seconds
    },
    // Fast 3G simulation
    fast3G: {
      downloadSpeed: 1600,   // 1.6 Mbps
      uploadSpeed: 750,      // 750 Kbps
      latency: 150,          // 150ms
      maxLoadTime: 5000,     // 5 seconds
    },
    // 4G simulation
    '4G': {
      downloadSpeed: 9000,   // 9 Mbps
      uploadSpeed: 9000,     // 9 Mbps
      latency: 170,          // 170ms
      maxLoadTime: 3000,     // 3 seconds
    }
  },

  // Lighthouse score targets
  lighthouse: {
    performance: {
      target: 90,
      warning: 80,
    },
    accessibility: {
      target: 95,
      warning: 90,
    },
    bestPractices: {
      target: 90,
      warning: 85,
    },
    seo: {
      target: 95,
      warning: 90,
    }
  },

  // Core Web Vitals targets
  webVitals: {
    // Combined score thresholds
    overall: {
      good: 0.8,     // 80% of metrics in "good" range
      warning: 0.6,  // 60% of metrics in "good" range
    },
    // Individual metric weights
    weights: {
      LCP: 0.25,
      FID: 0.25,
      CLS: 0.25,
      FCP: 0.25,
    }
  },

  // Memory usage budgets (in MB)
  memory: {
    heap: {
      maxSize: 100,    // 100MB max heap
      warning: 80,     // 80MB warning
    },
    total: {
      maxSize: 150,    // 150MB total memory
      warning: 120,    // 120MB warning
    }
  },

  // Third-party resource budgets
  thirdParty: {
    // Google Analytics
    analytics: {
      maxSize: 50000,    // 50KB
      maxRequests: 5,    // 5 requests
    },
    // Social media widgets
    social: {
      maxSize: 100000,   // 100KB
      maxRequests: 10,   // 10 requests
    },
    // CDN resources
    cdn: {
      maxSize: 200000,   // 200KB
      maxRequests: 20,   // 20 requests
    }
  }
}