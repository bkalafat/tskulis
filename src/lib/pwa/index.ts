/**
 * PWA Module Index
 * Progressive Web App features for TS Kulis
 */

// Core managers
export { ServiceWorkerManager, serviceWorkerManager } from './serviceWorker';
export { PushNotificationManager, pushNotificationManager, NotificationTemplates, PushUtils } from './pushNotifications';
export { OfflineManager, offlineManager, OfflineUtils } from './offlineManager';

// React hooks
export {
  useServiceWorker,
  usePushNotifications,
  useOffline,
  usePWAInstall,
  useNetworkStatus,
  useBackgroundSync,
  usePWA
} from './hooks';

// PWA Configuration
export const PWA_CONFIG = {
  // Service Worker
  serviceWorker: {
    scope: '/',
    updateViaCache: 'imports',
    skipWaiting: true
  },
  
  // Push Notifications
  pushNotifications: {
    vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
  },
  
  // Offline Support
  offline: {
    maxCacheSize: 100,
    maxApiCacheSize: 50,
    syncInterval: 30000, // 30 seconds
    retryAttempts: 3
  },
  
  // Cache Strategy
  cache: {
    staticAssets: [
      '/',
      '/offline',
      '/manifest.json',
      '/favicon.ico',
      '/icon-192x192.png',
      '/icon-512x512.png'
    ],
    apiEndpoints: [
      '/api/news',
      '/api/categories', 
      '/api/comments'
    ],
    dynamicRoutes: [
      '/trabzonspor',
      '/transfer',
      '/genel',
      '/futbol'
    ]
  }
};

// PWA Feature Detection
export const PWA_FEATURES = {
  serviceWorker: 'serviceWorker' in navigator,
  pushManager: 'PushManager' in window,
  notifications: 'Notification' in window,
  backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
  webShare: 'share' in navigator,
  fullscreen: 'requestFullscreen' in document.documentElement,
  installPrompt: 'beforeinstallprompt' in window,
  standalone: window.matchMedia('(display-mode: standalone)').matches
};

// PWA Utilities
export class PWAManager {
  private static instance: PWAManager;
  private initialized: boolean = false;
  
  private constructor() {}
  
  public static getInstance(): PWAManager {
    if (!PWAManager.instance) {
      PWAManager.instance = new PWAManager();
    }
    return PWAManager.instance;
  }
  
  public async initialize() {
    if (this.initialized) return;
    
    console.log('[PWA] Initializing PWA features...');
    
    try {
      // Initialize service worker
      if (PWA_FEATURES.serviceWorker) {
        console.log('[PWA] Service Worker supported');
      }
      
      // Initialize push notifications
      if (PWA_FEATURES.pushManager && PWA_FEATURES.notifications) {
        console.log('[PWA] Push Notifications supported');
      }
      
      // Initialize offline support
      console.log('[PWA] Offline support initialized');
      
      // Initialize background sync
      if (PWA_FEATURES.backgroundSync) {
        console.log('[PWA] Background Sync supported');
      }
      
      this.initialized = true;
      console.log('[PWA] PWA features initialized successfully');
      
    } catch (error) {
      console.error('[PWA] Failed to initialize PWA features:', error);
    }
  }
  
  public getFeatureSupport() {
    return PWA_FEATURES;
  }
  
  public isSupported() {
    return PWA_FEATURES.serviceWorker && PWA_FEATURES.notifications;
  }
  
  public isPWAInstalled() {
    return PWA_FEATURES.standalone || 
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any)?.standalone === true;
  }
}

// Notification permission helper
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!PWA_FEATURES.notifications) {
    console.warn('[PWA] Notifications not supported');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('[PWA] Notification permission denied');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[PWA] Failed to request notification permission:', error);
    return false;
  }
};

// Web Share API helper
export const shareContent = async (data: {
  title: string;
  text?: string;
  url?: string;
}): Promise<boolean> => {
  if (!PWA_FEATURES.webShare) {
    console.warn('[PWA] Web Share API not supported');
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    console.error('[PWA] Failed to share content:', error);
    return false;
  }
};

// Fullscreen helper
export const requestFullscreen = async (): Promise<boolean> => {
  if (!PWA_FEATURES.fullscreen) {
    console.warn('[PWA] Fullscreen API not supported');
    return false;
  }
  
  try {
    await document.documentElement.requestFullscreen();
    return true;
  } catch (error) {
    console.error('[PWA] Failed to request fullscreen:', error);
    return false;
  }
};

// PWA Status indicator
export const getPWAStatus = () => {
  return {
    installed: PWAManager.getInstance().isPWAInstalled(),
    supported: PWAManager.getInstance().isSupported(),
    features: PWA_FEATURES,
    online: navigator.onLine
  };
};

// Initialize PWA on module load
if (typeof window !== 'undefined') {
  PWAManager.getInstance().initialize();
}

// Export default PWA manager instance
export const pwaManager = PWAManager.getInstance();

// PWA Component Helpers
export const PWAHelpers = {
  // Format file size for cache info
  formatBytes: (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },
  
  // Get install prompt text based on browser
  getInstallPromptText: () => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return 'Ana ekranınıza ekleyerek daha hızlı erişim sağlayın';
    } else if (userAgent.includes('firefox')) {
      return 'Uygulamayı yükleyerek offline erişim kazanın';
    } else if (userAgent.includes('safari')) {
      return 'Ana ekranınıza ekleyin ve uygulama gibi kullanın';
    }
    
    return 'Uygulamayı yükleyerek daha iyi bir deneyim yaşayın';
  },
  
  // Get notification permission text
  getPermissionText: (permission: NotificationPermission) => {
    switch (permission) {
      case 'granted':
        return 'Bildirimler aktif ✅';
      case 'denied':
        return 'Bildirimler engellenmiş ❌';
      default:
        return 'Bildirim izni gerekli 🔔';
    }
  },
  
  // Check if should show install prompt
  shouldShowInstallPrompt: () => {
    return !PWAManager.getInstance().isPWAInstalled() && 
           PWA_FEATURES.installPrompt;
  }
};

export default {
  PWAManager,
  pwaManager,
  PWA_CONFIG,
  PWA_FEATURES,
  PWAHelpers,
  requestNotificationPermission,
  shareContent,
  requestFullscreen,
  getPWAStatus
};