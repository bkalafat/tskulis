/**
 * Offline Support Manager
 * Handles offline detection, data synchronization, and caching
 */

interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: { [key: string]: string };
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export class OfflineManager {
  private isOnline: boolean = navigator.onLine;
  private requestQueue: OfflineQueueItem[] = [];
  private syncInProgress: boolean = false;
  private callbacks: { [key: string]: Function[] } = {};
  private dbName = 'TSKulisOffline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.init();
  }

  private async init() {
    // Initialize IndexedDB
    await this.initIndexedDB();
    
    // Set up online/offline event listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
    
    // Load queued requests from storage
    await this.loadRequestQueue();
    
    // Start periodic sync check
    this.startPeriodicSync();
    
    console.log('[Offline] Manager initialized, online:', this.isOnline);
  }

  private async initIndexedDB() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('[Offline] IndexedDB error:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[Offline] IndexedDB connected');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores
        if (!db.objectStoreNames.contains('requestQueue')) {
          db.createObjectStore('requestQueue', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('offlineData')) {
          db.createObjectStore('offlineData', { keyPath: 'key' });
        }
        
        if (!db.objectStoreNames.contains('offlineNews')) {
          db.createObjectStore('offlineNews', { keyPath: '_id' });
        }
        
        if (!db.objectStoreNames.contains('offlineComments')) {
          db.createObjectStore('offlineComments', { keyPath: '_id' });
        }
        
        console.log('[Offline] IndexedDB schema updated');
      };
    });
  }

  private handleOnline() {
    console.log('[Offline] Device is back online');
    this.isOnline = true;
    this.emit('online');
    
    // Process queued requests
    this.processRequestQueue();
    
    // Sync offline data
    this.syncOfflineData();
  }

  private handleOffline() {
    console.log('[Offline] Device is offline');
    this.isOnline = false;
    this.emit('offline');
  }

  // Queue a request for later processing when online
  public async queueRequest(
    url: string, 
    method: string = 'GET', 
    data?: any, 
    headers?: { [key: string]: string },
    maxRetries: number = 3
  ): Promise<string> {
    const id = `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: OfflineQueueItem = {
      id,
      url,
      method,
      data,
      headers: headers || {},
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };
    
    this.requestQueue.push(queueItem);
    await this.saveRequestQueue();
    
    console.log('[Offline] Request queued:', queueItem);
    this.emit('requestQueued', queueItem);
    
    return id;
  }

  // Process all queued requests
  private async processRequestQueue() {
    if (!this.isOnline || this.syncInProgress || this.requestQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    console.log('[Offline] Processing request queue:', this.requestQueue.length, 'items');
    
    const processedItems: string[] = [];
    const failedItems: OfflineQueueItem[] = [];
    
    for (const item of this.requestQueue) {
      try {
        console.log('[Offline] Processing queued request:', item.url);
        
        const response = await fetch(item.url, {
          method: item.method,
          headers: {
            'Content-Type': 'application/json',
            ...item.headers
          },
          body: item.data ? JSON.stringify(item.data) : null
        });
        
        if (response.ok) {
          console.log('[Offline] Queued request successful:', item.url);
          processedItems.push(item.id);
          this.emit('requestProcessed', { item, response });
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        console.error('[Offline] Queued request failed:', item.url, error);
        
        item.retryCount++;
        
        if (item.retryCount < item.maxRetries) {
          failedItems.push(item);
          console.log('[Offline] Request will be retried:', item.url, `(${item.retryCount}/${item.maxRetries})`);
        } else {
          console.warn('[Offline] Request exceeded max retries:', item.url);
          processedItems.push(item.id); // Remove from queue
          this.emit('requestFailed', { item, error });
        }
      }
    }
    
    // Update queue
    this.requestQueue = this.requestQueue.filter(item => !processedItems.includes(item.id));
    this.requestQueue.push(...failedItems);
    
    await this.saveRequestQueue();
    
    this.syncInProgress = false;
    
    if (processedItems.length > 0) {
      console.log('[Offline] Processed', processedItems.length, 'queued requests');
      this.emit('queueProcessed', { processed: processedItems.length, failed: failedItems.length });
    }
  }

  // Save/load request queue from IndexedDB
  private async saveRequestQueue() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['requestQueue'], 'readwrite');
    const store = transaction.objectStore('requestQueue');
    
    // Clear existing queue
    await store.clear();
    
    // Save current queue
    for (const item of this.requestQueue) {
      await store.put(item);
    }
    
    console.log('[Offline] Request queue saved:', this.requestQueue.length, 'items');
  }

  private async loadRequestQueue() {
    if (!this.db) return;
    
    const transaction = this.db.transaction(['requestQueue'], 'readonly');
    const store = transaction.objectStore('requestQueue');
    const request = store.getAll();
    
    return new Promise<void>((resolve) => {
      request.onsuccess = () => {
        this.requestQueue = request.result || [];
        console.log('[Offline] Request queue loaded:', this.requestQueue.length, 'items');
        resolve();
      };
      
      request.onerror = () => {
        console.error('[Offline] Failed to load request queue');
        resolve();
      };
    });
  }

  // Save data for offline access
  public async saveOfflineData(key: string, data: any) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      
      await store.put({
        key,
        data,
        timestamp: Date.now()
      });
      
      console.log('[Offline] Data saved for offline access:', key);
      return true;
    } catch (error) {
      console.error('[Offline] Failed to save offline data:', error);
      return false;
    }
  }

  // Get offline data
  public async getOfflineData(key: string): Promise<any | null> {
    if (!this.db) return null;
    
    try {
      const transaction = this.db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.get(key);
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          resolve(result ? result.data : null);
        };
        
        request.onerror = () => {
          console.error('[Offline] Failed to get offline data:', key);
          resolve(null);
        };
      });
    } catch (error) {
      console.error('[Offline] Failed to get offline data:', error);
      return null;
    }
  }

  // Cache news for offline reading
  public async cacheNewsForOffline(newsItems: any[]) {
    if (!this.db) return false;
    
    try {
      const transaction = this.db.transaction(['offlineNews'], 'readwrite');
      const store = transaction.objectStore('offlineNews');
      
      // Clear existing news
      await store.clear();
      
      // Cache new items
      for (const item of newsItems) {
        await store.put({ 
          ...item, 
          cachedAt: Date.now() 
        });
      }
      
      console.log('[Offline] Cached', newsItems.length, 'news items');
      this.emit('newsCached', newsItems.length);
      
      return true;
    } catch (error) {
      console.error('[Offline] Failed to cache news:', error);
      return false;
    }
  }

  // Get cached news
  public async getCachedNews(): Promise<any[]> {
    if (!this.db) return [];
    
    try {
      const transaction = this.db.transaction(['offlineNews'], 'readonly');
      const store = transaction.objectStore('offlineNews');
      const request = store.getAll();
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const news = request.result || [];
          console.log('[Offline] Retrieved', news.length, 'cached news items');
          resolve(news);
        };
        
        request.onerror = () => {
          console.error('[Offline] Failed to get cached news');
          resolve([]);
        };
      });
    } catch (error) {
      console.error('[Offline] Failed to get cached news:', error);
      return [];
    }
  }

  // Sync offline data when back online
  private async syncOfflineData() {
    if (!this.isOnline) return;
    
    console.log('[Offline] Starting offline data sync');
    
    try {
      // Sync reading preferences
      const readingList = await this.getOfflineData('readingList');
      if (readingList && readingList.length > 0) {
        await this.syncReadingList(readingList);
      }
      
      // Sync user preferences
      const userPrefs = await this.getOfflineData('userPreferences');
      if (userPrefs) {
        await this.syncUserPreferences(userPrefs);
      }
      
      // Update last sync timestamp
      await this.saveOfflineData('lastSync', Date.now());
      
      this.emit('dataSynced');
      console.log('[Offline] Data sync completed');
      
    } catch (error) {
      console.error('[Offline] Data sync failed:', error);
      this.emit('syncFailed', error);
    }
  }

  private async syncReadingList(readingList: string[]) {
    try {
      const response = await fetch('/api/user/reading-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readingList })
      });
      
      if (response.ok) {
        console.log('[Offline] Reading list synced');
      }
    } catch (error) {
      console.error('[Offline] Failed to sync reading list:', error);
    }
  }

  private async syncUserPreferences(preferences: any) {
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      });
      
      if (response.ok) {
        console.log('[Offline] User preferences synced');
      }
    } catch (error) {
      console.error('[Offline] Failed to sync user preferences:', error);
    }
  }

  // Periodic sync check
  private startPeriodicSync() {
    setInterval(() => {
      if (this.isOnline && !this.syncInProgress && this.requestQueue.length > 0) {
        console.log('[Offline] Periodic sync check - processing queue');
        this.processRequestQueue();
      }
    }, 30000); // Check every 30 seconds
  }

  // Public methods
  public isOffline(): boolean {
    return !this.isOnline;
  }

  public getQueuedRequestsCount(): number {
    return this.requestQueue.length;
  }

  public async clearRequestQueue() {
    this.requestQueue = [];
    await this.saveRequestQueue();
    console.log('[Offline] Request queue cleared');
  }

  public async getStorageInfo() {
    if (!this.db) return null;
    
    try {
      const newsCount = await this.getRecordCount('offlineNews');
      const dataCount = await this.getRecordCount('offlineData');
      const queueCount = await this.getRecordCount('requestQueue');
      
      return {
        newsCount,
        dataCount,
        queueCount,
        totalRequests: this.requestQueue.length
      };
    } catch (error) {
      console.error('[Offline] Failed to get storage info:', error);
      return null;
    }
  }

  private async getRecordCount(storeName: string): Promise<number> {
    if (!this.db) return 0;
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore('requestQueue');
    const request = store.count();
    
    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(0);
    });
  }

  // Event system
  public on(event: string, callback: Function) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }

  public off(event: string, callback: Function) {
    if (this.callbacks[event]) {
      this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
    }
  }

  private emit(event: string, data?: any) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach(callback => callback(data));
    }
  }
}

// Singleton instance
export const offlineManager = new OfflineManager();

// Utility functions
export const OfflineUtils = {
  // Check if current request should be cached
  shouldCacheRequest: (url: string, method: string) => {
    return method === 'GET' && (
      url.includes('/api/news') ||
      url.includes('/api/categories') ||
      url.includes('/api/comments')
    );
  },

  // Get offline fallback response
  getOfflineFallback: (type: 'news' | 'comments' | 'generic') => {
    const fallbacks = {
      news: {
        items: [],
        message: 'Haberler şu anda kullanılamıyor. İnternet bağlantınızı kontrol edin.',
        offline: true
      },
      comments: {
        items: [],
        message: 'Yorumlar şu anda yüklenemiyor.',
        offline: true  
      },
      generic: {
        message: 'Bu içerik şu anda kullanılamıyor.',
        offline: true
      }
    };
    
    return fallbacks[type];
  },

  // Format sync status for display
  formatSyncStatus: (queueCount: number, isOnline: boolean) => {
    if (isOnline) {
      return queueCount > 0 
        ? `${queueCount} işlem senkronizasyon bekliyor` 
        : 'Senkronize';
    } else {
      return queueCount > 0 
        ? `Çevrimdışı - ${queueCount} işlem beklemede`
        : 'Çevrimdışı';
    }
  }
};