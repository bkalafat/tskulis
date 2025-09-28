/**
 * PWA Service Worker Manager
 * Manages service worker registration and PWA features
 */

export class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private callbacks: { [key: string]: Function[] } = {};

  constructor() {
    this.init();
  }

  private async init() {
    if ('serviceWorker' in navigator) {
      try {
        console.log('[PWA] Registering service worker...');
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'imports'
        });

        console.log('[PWA] Service worker registered successfully');
        
        // Listen for service worker updates
        this.registration.addEventListener('updatefound', () => {
          console.log('[PWA] Service worker update found');
          this.handleUpdateFound();
        });

        // Check for existing update
        if (this.registration.waiting) {
          this.updateAvailable = true;
          this.emit('updateAvailable', this.registration.waiting);
        }

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[PWA] Service worker controller changed');
          this.emit('controllerChanged');
          
          // Refresh the page to use the new service worker
          if (!this.updateAvailable) {
            window.location.reload();
          }
        });

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', event => {
          console.log('[PWA] Message from service worker:', event.data);
          this.handleServiceWorkerMessage(event.data);
        });

      } catch (error) {
        console.error('[PWA] Service worker registration failed:', error);
      }
    } else {
      console.warn('[PWA] Service workers are not supported');
    }
  }

  private handleUpdateFound() {
    if (!this.registration) return;

    const newWorker = this.registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed') {
        if (navigator.serviceWorker.controller) {
          // New update available
          this.updateAvailable = true;
          this.emit('updateAvailable', newWorker);
        } else {
          // First install
          this.emit('firstInstall');
        }
      }
    });
  }

  private handleServiceWorkerMessage(data: any) {
    switch (data.type) {
      case 'BACKGROUND_SYNC_SUCCESS':
        this.emit('backgroundSyncSuccess', data.data);
        break;
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data.data);
        break;
      case 'OFFLINE_STATUS':
        this.emit('offlineStatus', data.data);
        break;
    }
  }

  // Apply service worker update
  public applyUpdate() {
    if (!this.registration || !this.registration.waiting) {
      console.warn('[PWA] No service worker update available');
      return;
    }

    console.log('[PWA] Applying service worker update');
    this.registration.waiting.postMessage({ action: 'SKIP_WAITING' });
  }

  // Check for service worker updates manually
  public async checkForUpdates() {
    if (!this.registration) {
      console.warn('[PWA] No service worker registered');
      return false;
    }

    try {
      console.log('[PWA] Checking for service worker updates...');
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      console.error('[PWA] Failed to check for updates:', error);
      return false;
    }
  }

  // Cache specific URLs
  public async cacheUrls(urls: string[]) {
    if (!this.registration || !this.registration.active) {
      console.warn('[PWA] No active service worker');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };

      this.registration!.active!.postMessage(
        { action: 'CACHE_URLS', urls },
        [messageChannel.port2]
      );
    });
  }

  // Clear all caches
  public async clearCaches() {
    if (!this.registration || !this.registration.active) {
      console.warn('[PWA] No active service worker');
      return false;
    }

    return new Promise<boolean>((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.success || false);
      };

      this.registration!.active!.postMessage(
        { action: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
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

  // Get registration info
  public getRegistration() {
    return this.registration;
  }

  public isUpdateAvailable() {
    return this.updateAvailable;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();