/**
 * Push Notifications Manager
 * Handles push notification subscription and messaging
 */

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  data?: any;
}

export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string;

  constructor(vapidPublicKey: string = '') {
    this.vapidPublicKey = vapidPublicKey || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    this.init();
  }

  private async init() {
    // Check for service worker support
    if (!('serviceWorker' in navigator)) {
      console.warn('[Push] Service workers not supported');
      return;
    }

    // Check for push messaging support
    if (!('PushManager' in window)) {
      console.warn('[Push] Push messaging not supported');
      return;
    }

    // Check for notification support
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported');
      return;
    }

    try {
      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      console.log('[Push] Service worker ready');

      // Check existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('[Push] Existing subscription found');
      }
    } catch (error) {
      console.error('[Push] Initialization failed:', error);
    }
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    console.log('[Push] Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  public async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    // Request permission first
    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      console.warn('[Push] Notification permission not granted');
      return null;
    }

    try {
      // Subscribe to push manager
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey) as BufferSource
      });

      console.log('[Push] Push subscription successful:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('[Push] Push subscription failed:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.warn('[Push] No active subscription to unsubscribe');
      return true;
    }

    try {
      const result = await this.subscription.unsubscribe();
      
      if (result) {
        console.log('[Push] Push unsubscription successful');
        
        // Remove subscription from server
        await this.removeSubscriptionFromServer(this.subscription);
        
        this.subscription = null;
      }

      return result;
    } catch (error) {
      console.error('[Push] Push unsubscription failed:', error);
      throw error;
    }
  }

  // Check if push is supported and subscribed
  public isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  public isSubscribed(): boolean {
    return this.subscription !== null;
  }

  public getPermission(): NotificationPermission {
    return Notification.permission;
  }

  public getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  // Show local notification
  public async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) {
      throw new Error('Service worker not registered');
    }

    const permission = await this.requestPermission();
    
    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/badge-72x72.png',
      tag: payload.tag || 'default',
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      data: payload.data || {}
    };

    // Add actions if supported
    if (payload.actions && 'actions' in Notification.prototype) {
      (options as any).actions = payload.actions;
    }

    await this.registration.showNotification(payload.title, options);
  }

  // Send test notification
  public async sendTestNotification(): Promise<void> {
    await this.showNotification({
      title: 'Test Bildirimi - TS Kulis',
      body: 'Bu bir test bildirimidir. Push bildirimler çalışıyor!',
      icon: '/icon-192x192.png',
      tag: 'test-notification',
      actions: [
        {
          action: 'view',
          title: 'Görüntüle'
        },
        {
          action: 'dismiss', 
          title: 'Kapat'
        }
      ],
      data: {
        url: '/',
        timestamp: Date.now()
      }
    });
  }

  // Helper to convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        throw new Error(`Server response: ${response.status}`);
      }

      console.log('[Push] Subscription sent to server successfully');
    } catch (error) {
      console.error('[Push] Failed to send subscription to server:', error);
      // Don't throw - subscription can still work locally
    }
  }

  // Remove subscription from server
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint
        })
      });

      if (!response.ok) {
        throw new Error(`Server response: ${response.status}`);
      }

      console.log('[Push] Subscription removed from server successfully');
    } catch (error) {
      console.error('[Push] Failed to remove subscription from server:', error);
    }
  }
}

// Create push notification manager instance
export const pushNotificationManager = new PushNotificationManager();

// Notification templates
export const NotificationTemplates = {
  newsUpdate: (title: string, excerpt: string) => ({
    title: `Yeni Haber: ${title}`,
    body: excerpt,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'news-update',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Haberi Oku' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  }),

  breakingNews: (title: string) => ({
    title: '🚨 Son Dakika',
    body: title,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'breaking-news',
    requireInteraction: true,
    actions: [
      { action: 'view', title: 'Detayları Gör' },
      { action: 'share', title: 'Paylaş' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  }),

  matchUpdate: (match: string, score: string) => ({
    title: `⚽ ${match}`,
    body: `Skor: ${score}`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'match-update',
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'Maç Detayları' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  }),

  transferNews: (player: string, team: string) => ({
    title: '🔄 Transfer Haberi',
    body: `${player} ${team}'ye transfer oldu!`,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'transfer-news',
    requireInteraction: false,
    actions: [
      { action: 'view', title: 'Transfer Detayları' },
      { action: 'dismiss', title: 'Kapat' }
    ]
  })
};

// Helper functions
export const PushUtils = {
  // Check if device supports push notifications
  isSupported: () => {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  },

  // Get permission status with user-friendly message
  getPermissionStatus: () => {
    const permission = Notification.permission;
    const messages = {
      'granted': 'Bildirimler aktif',
      'denied': 'Bildirimler engellenmiş', 
      'default': 'Bildirim izni bekleniyor'
    };
    
    return {
      permission,
      message: messages[permission] || 'Bilinmeyen durum'
    };
  },

  // Format subscription info for display
  formatSubscription: (subscription: PushSubscription | null) => {
    if (!subscription) return null;
    
    return {
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      created: new Date().toISOString()
    };
  }
};