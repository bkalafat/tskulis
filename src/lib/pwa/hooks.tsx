/**
 * PWA React Hooks
 * Custom hooks for Progressive Web App features
 */

import { useState, useEffect, useCallback } from 'react';
import { serviceWorkerManager } from './serviceWorker';
import { pushNotificationManager, NotificationTemplates } from './pushNotifications';
import { offlineManager } from './offlineManager';

// Hook for service worker management
export function useServiceWorker() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Get initial registration
    setRegistration(serviceWorkerManager.getRegistration());
    setUpdateAvailable(serviceWorkerManager.isUpdateAvailable());

    // Listen for service worker events
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      setInstalling(false);
    };

    const handleFirstInstall = () => {
      setInstalling(true);
    };

    const handleControllerChanged = () => {
      setUpdateAvailable(false);
      setInstalling(false);
      setRegistration(serviceWorkerManager.getRegistration());
    };

    serviceWorkerManager.on('updateAvailable', handleUpdateAvailable);
    serviceWorkerManager.on('firstInstall', handleFirstInstall);
    serviceWorkerManager.on('controllerChanged', handleControllerChanged);

    return () => {
      serviceWorkerManager.off('updateAvailable', handleUpdateAvailable);
      serviceWorkerManager.off('firstInstall', handleFirstInstall);
      serviceWorkerManager.off('controllerChanged', handleControllerChanged);
    };
  }, []);

  const applyUpdate = useCallback(() => {
    serviceWorkerManager.applyUpdate();
  }, []);

  const checkForUpdates = useCallback(async () => {
    return await serviceWorkerManager.checkForUpdates();
  }, []);

  const cacheUrls = useCallback(async (urls: string[]) => {
    return await serviceWorkerManager.cacheUrls(urls);
  }, []);

  const clearCaches = useCallback(async () => {
    return await serviceWorkerManager.clearCaches();
  }, []);

  return {
    registration,
    updateAvailable,
    installing,
    applyUpdate,
    checkForUpdates,
    cacheUrls,
    clearCaches
  };
}

// Hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    setIsSupported(pushNotificationManager.isPushSupported());
    setIsSubscribed(pushNotificationManager.isSubscribed());
    setPermission(pushNotificationManager.getPermission());
    setSubscription(pushNotificationManager.getSubscription());
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const newPermission = await pushNotificationManager.requestPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }, []);

  const subscribe = useCallback(async () => {
    try {
      const newSubscription = await pushNotificationManager.subscribe();
      setIsSubscribed(!!newSubscription);
      setSubscription(newSubscription);
      return newSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    try {
      const result = await pushNotificationManager.unsubscribe();
      if (result) {
        setIsSubscribed(false);
        setSubscription(null);
      }
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }, []);

  const showNotification = useCallback(async (title: string, options: any) => {
    try {
      await pushNotificationManager.showNotification({ title, ...options });
      return true;
    } catch (error) {
      console.error('Failed to show notification:', error);
      throw error;
    }
  }, []);

  const sendTestNotification = useCallback(async () => {
    try {
      await pushNotificationManager.sendTestNotification();
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }, []);

  return {
    isSupported,
    isSubscribed,
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe,
    showNotification,
    sendTestNotification,
    templates: NotificationTemplates
  };
}

// Hook for offline functionality
export function useOffline() {
  const [isOffline, setIsOffline] = useState(offlineManager.isOffline());
  const [queuedRequests, setQueuedRequests] = useState(0);
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    setQueuedRequests(offlineManager.getQueuedRequestsCount());

    const handleOnline = () => {
      setIsOffline(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    const handleRequestQueued = () => {
      setQueuedRequests(offlineManager.getQueuedRequestsCount());
    };

    const handleQueueProcessed = () => {
      setQueuedRequests(offlineManager.getQueuedRequestsCount());
      setSyncInProgress(false);
    };

    const handleSyncStart = () => {
      setSyncInProgress(true);
    };

    offlineManager.on('online', handleOnline);
    offlineManager.on('offline', handleOffline);
    offlineManager.on('requestQueued', handleRequestQueued);
    offlineManager.on('queueProcessed', handleQueueProcessed);
    offlineManager.on('dataSynced', handleSyncStart);

    return () => {
      offlineManager.off('online', handleOnline);
      offlineManager.off('offline', handleOffline);
      offlineManager.off('requestQueued', handleRequestQueued);
      offlineManager.off('queueProcessed', handleQueueProcessed);
      offlineManager.off('dataSynced', handleSyncStart);
    };
  }, []);

  const queueRequest = useCallback(async (
    url: string,
    method: string = 'GET',
    data?: any,
    headers?: { [key: string]: string }
  ) => {
    return await offlineManager.queueRequest(url, method, data, headers);
  }, []);

  const saveOfflineData = useCallback(async (key: string, data: any) => {
    return await offlineManager.saveOfflineData(key, data);
  }, []);

  const getOfflineData = useCallback(async (key: string) => {
    return await offlineManager.getOfflineData(key);
  }, []);

  const cacheNews = useCallback(async (newsItems: any[]) => {
    return await offlineManager.cacheNewsForOffline(newsItems);
  }, []);

  const getCachedNews = useCallback(async () => {
    return await offlineManager.getCachedNews();
  }, []);

  const clearQueue = useCallback(async () => {
    await offlineManager.clearRequestQueue();
    setQueuedRequests(0);
  }, []);

  const getStorageInfo = useCallback(async () => {
    return await offlineManager.getStorageInfo();
  }, []);

  return {
    isOffline,
    isOnline: !isOffline,
    queuedRequests,
    syncInProgress,
    queueRequest,
    saveOfflineData,
    getOfflineData,
    cacheNews,
    getCachedNews,
    clearQueue,
    getStorageInfo
  };
}

// Hook for PWA installation
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    setIsInstalled(
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      (window.navigator as any)?.standalone === true
    );

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
      console.log('[PWA] Install prompt available');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      console.log('[PWA] App installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) {
      console.warn('[PWA] No install prompt available');
      return false;
    }

    try {
      const result = await installPrompt.prompt();
      const outcome = result.outcome;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[PWA] Install prompt failed:', error);
      return false;
    }
  }, [installPrompt]);

  const getInstallInstructions = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
      return {
        browser: 'Chrome',
        steps: [
          'Chrome menüsünü (⋮) açın',
          '"Ana ekrana ekle" veya "Uygulama yükle" seçeneğini seçin',
          'Onay penceresinde "Yükle" butonuna tıklayın'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        browser: 'Firefox',
        steps: [
          'Adres çubuğundaki ev simgesine tıklayın',
          '"Ana ekrana ekle" seçeneğini seçin',
          'Onay penceresinde "Ekle" butonuna tıklayın'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        browser: 'Safari',
        steps: [
          'Paylaş butonuna (⎋) tıklayın',
          '"Ana Ekrana Ekle" seçeneğini seçin',
          'Uygulama ismini düzenleyin ve "Ekle" butonuna tıklayın'
        ]
      };
    } else if (userAgent.includes('edg')) {
      return {
        browser: 'Edge',
        steps: [
          'Edge menüsünü (...) açın',
          '"Uygulamalar" > "Bu siteyi uygulama olarak yükle" seçeneğini seçin',
          'Onay penceresinde "Yükle" butonuna tıklayın'
        ]
      };
    }
    
    return {
      browser: 'Diğer',
      steps: [
        'Tarayıcı menüsünü açın',
        '"Ana ekrana ekle" veya "Uygulama yükle" seçeneğini arayın',
        'Yönergeleri takip ederek uygulamayı yükleyin'
      ]
    };
  }, []);

  return {
    isInstalled,
    isInstallable,
    installPrompt: !!installPrompt,
    promptInstall,
    getInstallInstructions
  };
}

// Hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('4g');

  useEffect(() => {
    const updateNetworkStatus = () => {
      setIsOnline(navigator.onLine);
      
      // Get connection info if available
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
      }
    };

    const handleOnline = () => {
      updateNetworkStatus();
      console.log('[Network] Connection restored');
    };

    const handleOffline = () => {
      updateNetworkStatus();
      console.log('[Network] Connection lost');
    };

    // Initial check
    updateNetworkStatus();

    // Listen for network changes
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  const getConnectionQuality = useCallback(() => {
    if (!isOnline) return 'offline';
    
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'poor';
      case '3g':
        return 'good';
      case '4g':
      default:
        return 'excellent';
    }
  }, [isOnline, effectiveType]);

  const shouldReduceDataUsage = useCallback(() => {
    return !isOnline || effectiveType === 'slow-2g' || effectiveType === '2g';
  }, [isOnline, effectiveType]);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    effectiveType,
    getConnectionQuality,
    shouldReduceDataUsage
  };
}

// Hook for background sync
export function useBackgroundSync() {
  const [syncSupported, setSyncSupported] = useState(false);
  const [syncRegistered, setSyncRegistered] = useState(false);
  
  useEffect(() => {
    setSyncSupported('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype);
  }, []);

  const registerBackgroundSync = useCallback(async (tag: string = 'background-sync') => {
    if (!syncSupported) {
      console.warn('[BackgroundSync] Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      setSyncRegistered(true);
      console.log('[BackgroundSync] Registered:', tag);
      return true;
    } catch (error) {
      console.error('[BackgroundSync] Registration failed:', error);
      return false;
    }
  }, [syncSupported]);

  return {
    syncSupported,
    syncRegistered,
    registerBackgroundSync
  };
}

// Combined PWA hook
export function usePWA() {
  const serviceWorker = useServiceWorker();
  const pushNotifications = usePushNotifications();
  const offline = useOffline();
  const install = usePWAInstall();
  const network = useNetworkStatus();
  const backgroundSync = useBackgroundSync();

  const getPWAStatus = useCallback(() => {
    return {
      serviceWorker: !!serviceWorker.registration,
      pushNotifications: pushNotifications.isSupported,
      offline: true, // Always supported
      installable: install.isInstallable,
      installed: install.isInstalled,
      online: network.isOnline,
      backgroundSync: backgroundSync.syncSupported
    };
  }, [serviceWorker, pushNotifications, install, network, backgroundSync]);

  return {
    serviceWorker,
    pushNotifications,
    offline,
    install,
    network,
    backgroundSync,
    getPWAStatus
  };
}