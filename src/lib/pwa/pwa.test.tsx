/**
 * PWA Features Tests
 * Test suite for Progressive Web App functionality
 */

import { renderHook, act } from '@testing-library/react';
import { 
  useServiceWorker,
  usePushNotifications,
  useOffline,
  usePWAInstall,
  useNetworkStatus,
  usePWA
} from './hooks';
import { PWA_FEATURES, PWAHelpers, requestNotificationPermission } from './index';

// Mock service worker
const mockServiceWorkerManager = {
  getRegistration: jest.fn(),
  isUpdateAvailable: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  applyUpdate: jest.fn(),
  checkForUpdates: jest.fn(),
  cacheUrls: jest.fn(),
  clearCaches: jest.fn()
};

// Mock push notifications
const mockPushManager = {
  isPushSupported: jest.fn(),
  isSubscribed: jest.fn(),
  getPermission: jest.fn(),
  getSubscription: jest.fn(),
  requestPermission: jest.fn(),
  subscribe: jest.fn(),
  unsubscribe: jest.fn(),
  showNotification: jest.fn(),
  sendTestNotification: jest.fn()
};

// Mock offline manager
const mockOfflineManager = {
  isOffline: jest.fn(),
  getQueuedRequestsCount: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  queueRequest: jest.fn(),
  saveOfflineData: jest.fn(),
  getOfflineData: jest.fn(),
  cacheNewsForOffline: jest.fn(),
  getCachedNews: jest.fn(),
  clearRequestQueue: jest.fn(),
  getStorageInfo: jest.fn()
};

// Mock global objects
const mockNavigator = {
  onLine: true,
  serviceWorker: {
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: {
        postMessage: jest.fn()
      }
    } as any)
  },
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124'
};

const mockNotification = {
  permission: 'default' as NotificationPermission,
  requestPermission: jest.fn().mockResolvedValue('granted' as NotificationPermission)
};

// Setup mocks
beforeAll(() => {
  Object.defineProperty(window, 'navigator', {
    value: mockNavigator,
    writable: true
  });
  
  Object.defineProperty(window, 'Notification', {
    value: mockNotification,
    writable: true
  });
});

describe('PWA Hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useServiceWorker', () => {
    it('should initialize with default state', () => {
      mockServiceWorkerManager.getRegistration.mockReturnValue(null);
      mockServiceWorkerManager.isUpdateAvailable.mockReturnValue(false);

      const { result } = renderHook(() => useServiceWorker());
      
      expect(result.current.registration).toBeNull();
      expect(result.current.updateAvailable).toBe(false);
      expect(result.current.installing).toBe(false);
    });

    it('should handle update available', async () => {
      const { result } = renderHook(() => useServiceWorker());
      
      await act(async () => {
        result.current.applyUpdate();
      });
      
      expect(typeof result.current.applyUpdate).toBe('function');
    });
  });

  describe('usePushNotifications', () => {
    it('should check push support', () => {
      mockPushManager.isPushSupported.mockReturnValue(true);
      mockPushManager.isSubscribed.mockReturnValue(false);
      mockPushManager.getPermission.mockReturnValue('default');
      mockPushManager.getSubscription.mockReturnValue(null);

      const { result } = renderHook(() => usePushNotifications());
      
      expect(result.current.isSupported).toBe(true);
      expect(result.current.isSubscribed).toBe(false);
      expect(result.current.permission).toBe('default');
    });

    it('should handle subscription', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        toJSON: () => ({
          endpoint: 'https://fcm.googleapis.com/fcm/send/test',
          keys: { p256dh: 'test', auth: 'test' }
        })
      };

      mockPushManager.subscribe.mockResolvedValue(mockSubscription);

      const { result } = renderHook(() => usePushNotifications());
      
      await act(async () => {
        const subscription = await result.current.subscribe();
        expect(subscription).toEqual(mockSubscription);
      });
    });
  });

  describe('useOffline', () => {
    it('should track offline state', () => {
      mockOfflineManager.isOffline.mockReturnValue(false);
      mockOfflineManager.getQueuedRequestsCount.mockReturnValue(0);

      const { result } = renderHook(() => useOffline());
      
      expect(result.current.isOffline).toBe(false);
      expect(result.current.isOnline).toBe(true);
      expect(result.current.queuedRequests).toBe(0);
    });

    it('should handle offline data operations', async () => {
      const { result } = renderHook(() => useOffline());
      
      const testData = { test: 'data' };
      mockOfflineManager.saveOfflineData.mockResolvedValue(true);
      mockOfflineManager.getOfflineData.mockResolvedValue(testData);
      
      await act(async () => {
        const saved = await result.current.saveOfflineData('test', testData);
        expect(saved).toBe(true);
        
        const loaded = await result.current.getOfflineData('test');
        expect(loaded).toEqual(testData);
      });
    });
  });

  describe('usePWAInstall', () => {
    it('should detect installation state', () => {
      const { result } = renderHook(() => usePWAInstall());
      
      expect(typeof result.current.isInstalled).toBe('boolean');
      expect(typeof result.current.isInstallable).toBe('boolean');
      expect(typeof result.current.promptInstall).toBe('function');
      expect(typeof result.current.getInstallInstructions).toBe('function');
    });

    it('should provide install instructions', () => {
      const { result } = renderHook(() => usePWAInstall());
      
      const instructions = result.current.getInstallInstructions();
      expect(instructions).toHaveProperty('browser');
      expect(instructions).toHaveProperty('steps');
      expect(Array.isArray(instructions.steps)).toBe(true);
    });
  });

  describe('useNetworkStatus', () => {
    it('should track network status', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(typeof result.current.connectionType).toBe('string');
      expect(typeof result.current.effectiveType).toBe('string');
    });

    it('should provide connection quality assessment', () => {
      const { result } = renderHook(() => useNetworkStatus());
      
      const quality = result.current.getConnectionQuality();
      expect(['offline', 'poor', 'good', 'excellent']).toContain(quality);
    });
  });

  describe('usePWA', () => {
    it('should combine all PWA features', () => {
      const { result } = renderHook(() => usePWA());
      
      expect(result.current).toHaveProperty('serviceWorker');
      expect(result.current).toHaveProperty('pushNotifications');
      expect(result.current).toHaveProperty('offline');
      expect(result.current).toHaveProperty('install');
      expect(result.current).toHaveProperty('network');
      expect(result.current).toHaveProperty('backgroundSync');
    });

    it('should provide PWA status', () => {
      const { result } = renderHook(() => usePWA());
      
      const status = result.current.getPWAStatus();
      expect(status).toHaveProperty('serviceWorker');
      expect(status).toHaveProperty('pushNotifications');
      expect(status).toHaveProperty('offline');
      expect(status).toHaveProperty('installable');
      expect(status).toHaveProperty('installed');
      expect(status).toHaveProperty('online');
      expect(status).toHaveProperty('backgroundSync');
    });
  });
});

describe('PWA Utilities', () => {
  describe('PWA_FEATURES', () => {
    it('should detect PWA feature support', () => {
      expect(typeof PWA_FEATURES.serviceWorker).toBe('boolean');
      expect(typeof PWA_FEATURES.pushManager).toBe('boolean');
      expect(typeof PWA_FEATURES.notifications).toBe('boolean');
      expect(typeof PWA_FEATURES.backgroundSync).toBe('boolean');
      expect(typeof PWA_FEATURES.webShare).toBe('boolean');
      expect(typeof PWA_FEATURES.fullscreen).toBe('boolean');
      expect(typeof PWA_FEATURES.installPrompt).toBe('boolean');
      expect(typeof PWA_FEATURES.standalone).toBe('boolean');
    });
  });

  describe('PWAHelpers', () => {
    it('should format bytes correctly', () => {
      expect(PWAHelpers.formatBytes(0)).toBe('0 Bytes');
      expect(PWAHelpers.formatBytes(1024)).toBe('1 KB');
      expect(PWAHelpers.formatBytes(1048576)).toBe('1 MB');
    });

    it('should provide install prompt text', () => {
      const text = PWAHelpers.getInstallPromptText();
      expect(typeof text).toBe('string');
      expect(text.length).toBeGreaterThan(0);
    });

    it('should format permission text', () => {
      expect(PWAHelpers.getPermissionText('granted')).toContain('aktif');
      expect(PWAHelpers.getPermissionText('denied')).toContain('engellenmiş');
      expect(PWAHelpers.getPermissionText('default')).toContain('gerekli');
    });

    it('should determine install prompt visibility', () => {
      const shouldShow = PWAHelpers.shouldShowInstallPrompt();
      expect(typeof shouldShow).toBe('boolean');
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request notification permission', async () => {
      mockNotification.requestPermission.mockResolvedValue('granted');
      
      const result = await requestNotificationPermission();
      expect(result).toBe(true);
    });

    it('should handle permission denial', async () => {
      mockNotification.permission = 'denied';
      
      const result = await requestNotificationPermission();
      expect(result).toBe(false);
    });
  });
});

describe('PWA Integration', () => {
  it('should handle service worker + push notifications', () => {
    const { result: swResult } = renderHook(() => useServiceWorker());
    const { result: pushResult } = renderHook(() => usePushNotifications());
    
    expect(swResult.current).toBeDefined();
    expect(pushResult.current).toBeDefined();
  });

  it('should handle offline + network status', () => {
    const { result: offlineResult } = renderHook(() => useOffline());
    const { result: networkResult } = renderHook(() => useNetworkStatus());
    
    expect(offlineResult.current.isOffline).toBe(!networkResult.current.isOnline);
  });

  it('should provide comprehensive PWA status', () => {
    const { result } = renderHook(() => usePWA());
    
    const status = result.current.getPWAStatus();
    
    // Should have all required properties
    const requiredProps = [
      'serviceWorker', 'pushNotifications', 'offline', 
      'installable', 'installed', 'online', 'backgroundSync'
    ];
    
    requiredProps.forEach(prop => {
      expect(status).toHaveProperty(prop);
      expect(typeof status[prop]).toBe('boolean');
    });
  });
});

describe('PWA Error Handling', () => {
  it('should handle service worker errors gracefully', async () => {
    mockServiceWorkerManager.checkForUpdates.mockRejectedValue(new Error('SW Error'));
    
    const { result } = renderHook(() => useServiceWorker());
    
    await act(async () => {
      try {
        await result.current.checkForUpdates();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('should handle push notification errors', async () => {
    mockPushManager.subscribe.mockRejectedValue(new Error('Push Error'));
    
    const { result } = renderHook(() => usePushNotifications());
    
    await act(async () => {
      try {
        await result.current.subscribe();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('should handle offline storage errors', async () => {
    mockOfflineManager.saveOfflineData.mockRejectedValue(new Error('Storage Error'));
    
    const { result } = renderHook(() => useOffline());
    
    await act(async () => {
      try {
        await result.current.saveOfflineData('test', {});
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});