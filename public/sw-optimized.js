/**
 * Advanced Service Worker for TS Kulis
 * 
 * Optimized caching strategies for news website performance:
 * - Immediate static asset caching
 * - Smart API response caching with TTL
 * - Progressive image loading and caching
 * - Offline-first approach for content
 * - Background sync for user actions
 */

const VERSION = '2.0.0';
const CACHE_PREFIX = 'tskulis';
const CACHES = {
  STATIC: `${CACHE_PREFIX}-static-v${VERSION}`,
  DYNAMIC: `${CACHE_PREFIX}-dynamic-v${VERSION}`,
  IMAGES: `${CACHE_PREFIX}-images-v${VERSION}`,
  API: `${CACHE_PREFIX}-api-v${VERSION}`,
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Routes with specific caching strategies
const CACHE_STRATEGIES = {
  // Static assets: Cache First (long TTL)
  static: {
    pattern: /\.(js|css|woff|woff2|ttf|eot)$/,
    strategy: 'cache-first',
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
  },
  
  // Images: Cache First with fallback
  images: {
    pattern: /\.(png|jpg|jpeg|gif|svg|webp|avif)$/i,
    strategy: 'cache-first',
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  
  // API responses: Stale While Revalidate
  api: {
    pattern: /\/api\/(news|categories)/,
    strategy: 'stale-while-revalidate',
    ttl: 5 * 60 * 1000, // 5 minutes
  },
  
  // Pages: Network First with cache fallback
  pages: {
    pattern: /\/(trabzonspor|transfer|genel|futbol|adminpanel)/,
    strategy: 'network-first',
    ttl: 60 * 60 * 1000, // 1 hour
  },
};

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  console.log(`SW ${VERSION}: Installing...`);
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHES.STATIC);
      
      try {
        await cache.addAll(CRITICAL_RESOURCES);
        console.log(`SW ${VERSION}: Critical resources cached`);
      } catch (error) {
        console.error(`SW ${VERSION}: Failed to cache critical resources`, error);
      }
      
      // Force activation
      return self.skipWaiting();
    })()
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log(`SW ${VERSION}: Activating...`);
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      const oldCaches = cacheNames.filter(name => 
        name.startsWith(CACHE_PREFIX) && !Object.values(CACHES).includes(name)
      );
      
      await Promise.all(oldCaches.map(name => {
        console.log(`SW ${VERSION}: Deleting old cache: ${name}`);
        return caches.delete(name);
      }));
      
      // Take control of all clients
      return self.clients.claim();
    })()
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and non-HTTP(S)
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }
  
  // Determine and apply caching strategy
  const strategy = getCachingStrategy(request);
  if (strategy) {
    event.respondWith(strategy.handler(request, strategy.options));
  }
});

// Get appropriate caching strategy for request
function getCachingStrategy(request) {
  const url = request.url;
  
  // Static assets
  if (CACHE_STRATEGIES.static.pattern.test(url) || url.includes('_next/static')) {
    return {
      handler: cacheFirstStrategy,
      options: { 
        cacheName: CACHES.STATIC,
        ttl: CACHE_STRATEGIES.static.ttl 
      }
    };
  }
  
  // Images
  if (CACHE_STRATEGIES.images.pattern.test(url) || url.includes('firebasestorage.googleapis.com')) {
    return {
      handler: cacheFirstStrategy,
      options: { 
        cacheName: CACHES.IMAGES,
        ttl: CACHE_STRATEGIES.images.ttl 
      }
    };
  }
  
  // API requests
  if (CACHE_STRATEGIES.api.pattern.test(url)) {
    return {
      handler: staleWhileRevalidateStrategy,
      options: { 
        cacheName: CACHES.API,
        ttl: CACHE_STRATEGIES.api.ttl 
      }
    };
  }
  
  // Pages
  if (request.headers.get('accept')?.includes('text/html')) {
    return {
      handler: networkFirstStrategy,
      options: { 
        cacheName: CACHES.DYNAMIC,
        ttl: CACHE_STRATEGIES.pages.ttl 
      }
    };
  }
  
  // Default dynamic content
  return {
    handler: networkFirstStrategy,
    options: { 
      cacheName: CACHES.DYNAMIC,
      ttl: CACHE_STRATEGIES.pages.ttl 
    }
  };
}

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request, { cacheName, ttl }) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    // Return cached response if valid and not expired
    if (cachedResponse && !isResponseExpired(cachedResponse, ttl)) {
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Clone and cache the response with timestamp
      const responseToCache = await addTimestamp(networkResponse.clone());
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error(`Cache First failed for ${request.url}:`, error);
    
    // Return cached response as fallback
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for images
    if (request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/i)) {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="#999" font-family="Arial">Resim Yüklenemedi</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    
    return new Response('Kaynak bulunamadı', { status: 404 });
  }
}

// Stale While Revalidate Strategy - for API responses
async function staleWhileRevalidateStrategy(request, { cacheName, ttl }) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always fetch from network in background to update cache
  const networkPromise = fetch(request).then(async (networkResponse) => {
    if (networkResponse.ok) {
      const responseToCache = await addTimestamp(networkResponse.clone());
      await cache.put(request, responseToCache);
    }
    return networkResponse;
  }).catch((error) => {
    console.error(`Network fetch failed for ${request.url}:`, error);
    return null;
  });
  
  // Return cached response immediately if available and not expired
  if (cachedResponse && !isResponseExpired(cachedResponse, ttl)) {
    return cachedResponse;
  }
  
  // If no valid cached response, wait for network
  try {
    const networkResponse = await networkPromise;
    return networkResponse || cachedResponse || new Response('Servis kullanılamıyor', { status: 503 });
  } catch (error) {
    return cachedResponse || new Response('Servis kullanılamıyor', { status: 503 });
  }
}

// Network First Strategy - for pages
async function networkFirstStrategy(request, { cacheName, ttl }) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(cacheName);
      const responseToCache = await addTimestamp(networkResponse.clone());
      await cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    console.error(`Network first failed for ${request.url}:`, error);
    
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML requests
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/offline.html') || new Response(`
        <!DOCTYPE html>
        <html lang="tr">
        <head>
          <meta charset="utf-8">
          <title>Çevrimdışı - TS Kulis</title>
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #8B1538; }
            .offline-icon { font-size: 64px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="offline-icon">📱</div>
          <h1>Çevrimdışı</h1>
          <p>İnternet bağlantınızı kontrol edin ve tekrar deneyin.</p>
          <button onclick="window.location.reload()">Tekrar Dene</button>
        </body>
        </html>
      `, { 
        status: 503, 
        headers: { 'Content-Type': 'text/html' } 
      });
    }
    
    return new Response('Çevrimdışı', { status: 503 });
  }
}

// Utility functions
async function addTimestamp(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-cached-at', Date.now().toString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers,
  });
}

function isResponseExpired(response, ttl) {
  const cachedAt = response.headers.get('sw-cached-at');
  if (!cachedAt) return false;
  
  const age = Date.now() - parseInt(cachedAt, 10);
  return age > ttl;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log(`SW ${VERSION}: Background sync event:`, event.tag);
  
  if (event.tag === 'comment-sync') {
    event.waitUntil(syncComments());
  }
});

async function syncComments() {
  // Handle queued comment submissions when online
  try {
    const cache = await caches.open(CACHES.DYNAMIC);
    const requests = await cache.keys();
    
    const commentRequests = requests.filter(req => 
      req.url.includes('/api/comments') && req.method === 'POST'
    );
    
    for (const request of commentRequests) {
      try {
        await fetch(request);
        await cache.delete(request);
        console.log(`SW ${VERSION}: Comment synced successfully`);
      } catch (error) {
        console.error(`SW ${VERSION}: Failed to sync comment:`, error);
      }
    }
  } catch (error) {
    console.error(`SW ${VERSION}: Background sync failed:`, error);
  }
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: VERSION });
  }
});

console.log(`SW ${VERSION}: Service Worker loaded and ready`);